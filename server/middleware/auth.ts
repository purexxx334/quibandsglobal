import { Response, NextFunction } from 'express';
import { supabaseAdmin, supabaseAnon } from '../config/supabase';
import { AuthenticatedRequest, AuthenticatedUser, UserRole, ApiResponse } from '../types';

/**
 * Authentication Middleware
 * Validates the Supabase JWT token and attaches user & role data to `req.user`.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid Authorization header. Expected Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token not provided.',
      });
    }

    // 1. Verify token with Supabase Auth
    const { data: userData, error: authError } = await supabaseAnon.auth.getUser(token);

    if (authError || !userData.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session token.',
        details: authError?.message,
      });
    }

    const user = userData.user;

    // 2. Fetch User Role from database (Never trust frontend claims)
    let userRole: UserRole = 'user';
    const { data: roleRows, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleRows && roleRows.length > 0) {
      if (roleRows.some((r) => r.role === 'admin')) {
        userRole = 'admin';
      } else if (roleRows.some((r) => r.role === 'moderator')) {
        userRole = 'moderator';
      } else {
        userRole = 'user';
      }
    } else if (!roleError) {
      // If role record doesn't exist yet, insert default 'user' role
      await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: user.id, role: 'user' })
        .select()
        .maybeSingle();
    }

    // 3. Fetch User Profile from database
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    let profile = profileData;

    // Self-healing fallback: If trigger missed profile creation, create it now
    if (!profile && !profileError) {
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const username = user.user_metadata?.username || user.email?.split('@')[0];

      const { data: newProfile } = await supabaseAdmin
        .from('profiles')
        .insert({
          auth_user_id: user.id,
          email: user.email || '',
          full_name: fullName,
          username: username,
          account_status: 'active',
        })
        .select()
        .maybeSingle();

      profile = newProfile;
    }

    // 4. Attach verified user to request
    req.user = {
      id: user.id,
      email: user.email || '',
      role: userRole,
      supabaseUser: user,
      profile: profile ? { ...profile, role: userRole } : null,
    };

    return next();
  } catch (err: any) {
    console.error('requireAuth middleware error:', err);
    return res.status(500).json({
      success: false,
      error: 'Authentication verification failed.',
      details: err.message,
    });
  }
}

import { requireRole } from './role';
export { requireRole };
export const requireAdmin = requireRole('admin');




