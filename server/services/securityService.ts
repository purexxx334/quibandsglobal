import { Request } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { SecurityLog } from '../types';
import { parseUserAgent } from '../utils/userAgentParser';
import { notificationService } from './notificationService';

export interface RecordSecurityEventParams {
  userId?: string | null;
  userEmail?: string | null;
  eventType: string; // 'login_success', 'login_failed', 'password_reset_request', 'password_reset_success', 'session_revoked', 'account_suspended', 'account_flagged'
  status?: 'success' | 'failed' | 'warning';
  req?: Request;
  sessionId?: string | null;
  authMethod?: string;
  details?: Record<string, any>;
  customIp?: string;
  customUserAgent?: string;
}

export class SecurityService {
  /**
   * Record a login or security telemetry event
   */
  async recordSecurityEvent(params: RecordSecurityEventParams): Promise<SecurityLog | null> {
    try {
      const userAgentString = params.customUserAgent || params.req?.headers['user-agent'] || '';
      const parsedUa = parseUserAgent(userAgentString);

      // Extract real client IP (prioritize proxy headers from Render, Cloudflare, AWS, Nginx)
      const cfConnectingIp = params.req?.headers['cf-connecting-ip'];
      const xRealIp = params.req?.headers['x-real-ip'];
      const xForwardedFor = params.req?.headers['x-forwarded-for'];
      
      let rawIp = params.customIp;
      if (!rawIp) {
        if (typeof cfConnectingIp === 'string' && cfConnectingIp) {
          rawIp = cfConnectingIp;
        } else if (typeof xRealIp === 'string' && xRealIp) {
          rawIp = xRealIp;
        } else if (typeof xForwardedFor === 'string' && xForwardedFor) {
          rawIp = xForwardedFor.split(',')[0].trim();
        } else if (params.req?.ip) {
          rawIp = params.req.ip;
        } else {
          rawIp = params.req?.socket?.remoteAddress || '127.0.0.1';
        }
      }

      // Clean IPv6 mapped IPv4 prefix (e.g. ::ffff:192.168.1.1 -> 192.168.1.1, ::1 -> 127.0.0.1)
      let ipAddress = rawIp.replace(/^.*:/, '').trim();
      if (!ipAddress || ipAddress === '1' || rawIp === '::1') {
        ipAddress = '127.0.0.1';
      }

      // Geolocation extraction (Leverage proxy geo headers if present)
      const proxyCountry = (
        params.req?.headers['cf-ipcountry'] || 
        params.req?.headers['x-render-ip-country'] || 
        params.req?.headers['x-country'] ||
        ''
      ).toString();

      const proxyCity = (
        params.req?.headers['cf-ipcity'] || 
        params.req?.headers['x-render-ip-city'] || 
        params.req?.headers['x-city'] ||
        ''
      ).toString();

      const isLocal = ipAddress === '127.0.0.1' || ipAddress === 'localhost' || ipAddress === '::1';

      const geoLocation = {
        country: proxyCountry || (isLocal ? 'Local Development' : 'Verified Public IP'),
        city: proxyCity || (isLocal ? 'Local Host' : 'Cloud Node'),
        region: isLocal ? 'Dev Environment' : 'Secure Edge Network',
      };

      const riskScore = params.status === 'failed' ? 65 : 10;
      const riskIndicators: string[] = params.status === 'failed' ? ['failed_authentication'] : [];

      const logData = {
        user_id: params.userId || null,
        user_email: params.userEmail || null,
        event_type: params.eventType,
        status: params.status || 'success',
        ip_address: ipAddress,
        geo_location: geoLocation,
        device_type: parsedUa.deviceType,
        operating_system: parsedUa.operatingSystem,
        browser: parsedUa.browser,
        user_agent: userAgentString.slice(0, 500),
        session_id: params.sessionId || null,
        auth_method: params.authMethod || 'email_password',
        risk_score: riskScore,
        risk_indicators: riskIndicators,
        details: params.details || {},
      };

      // 1. Insert Security Log
      const { data: logEntry, error } = await supabaseAdmin
        .from('security_logs')
        .insert(logData)
        .select()
        .single();

      if (error) {
        console.error('Security log insert error:', error.message);
        throw error;
      }

      // 2. Dispatch Admin Notifications for critical / warning events
      if (params.eventType === 'login_failed' && riskIndicators.includes('multiple_failed_attempts')) {
        await notificationService.createNotification({
          title: 'Multiple Failed Login Attempts',
          message: `Multiple failed authentications detected for ${params.userEmail} from IP ${ipAddress}`,
          severity: 'warning',
          event_type: 'MULTIPLE_FAILED_LOGINS',
          related_user_id: params.userId,
          metadata: { ip: ipAddress, count: 3 },
        });
      } else if (params.eventType === 'account_suspended') {
        await notificationService.createNotification({
          title: 'Account Suspended',
          message: `User account ${params.userEmail || params.userId} has been suspended by administrator.`,
          severity: 'warning',
          event_type: 'ACCOUNT_SUSPENDED',
          related_user_id: params.userId,
        });
      } else if (params.eventType === 'password_reset_request') {
        await notificationService.createNotification({
          title: 'Password Reset Initiated',
          message: `Password recovery requested for ${params.userEmail}`,
          severity: 'info',
          event_type: 'PASSWORD_RESET_REQUEST',
          related_user_id: params.userId,
        });
      }

      return logEntry;
    } catch (err: any) {
      console.warn('SecurityService error:', err.message);
      return null;
    }
  }

  /**
   * Get paginated security logs (Admin-only)
   */
  async getSecurityLogs(limit = 100, eventType?: string): Promise<SecurityLog[]> {
    let query = supabaseAdmin
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list security logs: ${error.message}`);
    }

    return data || [];
  }
}

export const securityService = new SecurityService();
