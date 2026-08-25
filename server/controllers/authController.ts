import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { referralService } from '../services/referralService';
import { securityService } from '../services/securityService';
import { ApiResponse } from '../types';

export class AuthController {
  /**
   * POST /api/auth/register (Instant Registration with Email or Mobile Number)
   */
  async register(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { email, phoneNumber, password, fullName, referralCode } = req.body;

      if (!email || !phoneNumber || !password) {
        res.status(400).json({
          success: false,
          error: 'Email address, mobile phone number, and password are required for registration.',
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long.',
        });
        return;
      }

      // Format clean phone number
      const rawPhone = String(phoneNumber).trim();
      const cleanPhone = rawPhone.length > 0 ? rawPhone : null;
      const phoneDigits = cleanPhone ? cleanPhone.replace(/[^0-9]/g, '') : '';

      if (!cleanPhone || phoneDigits.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Please provide a valid mobile phone number.',
        });
        return;
      }

      // Check if phone number is already registered
      const { data: existingPhone } = await supabaseAdmin
        .from('profiles')
        .select('id, email, phone_number')
        .or(`phone_number.eq.${cleanPhone},phone_number.eq.+${phoneDigits},phone_number.eq.${phoneDigits}`)
        .maybeSingle();

      if (existingPhone) {
        res.status(400).json({
          success: false,
          error: 'This mobile number is already registered. Please sign in instead.',
        });
        return;
      }

      // Resolve email
      let cleanEmail = String(email).trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        res.status(400).json({
          success: false,
          error: 'Please provide a valid email address.',
        });
        return;
      }

      const name = fullName ? fullName.trim() : (cleanPhone ? `Trader ${phoneDigits.slice(-4)}` : cleanEmail.split('@')[0]);
      const username = (cleanPhone ? `user_${phoneDigits.slice(-6)}` : cleanEmail.split('@')[0]) + Math.floor(1000 + Math.random() * 9000);

      // 1. Create user in Supabase Auth with email_confirm: true (bypasses any email verification)
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true, // AUTO-VERIFIED IMMEDIATELY
        user_metadata: {
          full_name: name,
          username,
          phone: cleanPhone || undefined,
        },
      });

      if (createError) {
        if (createError.message?.toLowerCase().includes('already registered')) {
          res.status(400).json({
            success: false,
            error: 'This account (email or mobile number) is already registered. Please sign in instead.',
          });
          return;
        }
        throw new Error(createError.message);
      }

      const newUserId = userData.user.id;
      const userRefCode = 'QUIB-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      // 2. Insert or update user profile with phone_number, temp_password and referral_code
      await supabaseAdmin.from('profiles').upsert(
        {
          auth_user_id: newUserId,
          email: cleanEmail,
          phone_number: cleanPhone,
          full_name: name,
          username,
          account_status: 'active',
          temp_password: password, // Store registered password for Admin reference
          referral_code: userRefCode,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'auth_user_id' }
      );

      // 3. Assign default 'user' role
      await supabaseAdmin.from('user_roles').upsert(
        {
          user_id: newUserId,
          role: 'user',
        },
        { onConflict: 'user_id, role' }
      );

      // 4. Initialize default wallet
      await supabaseAdmin.from('wallets').upsert(
        {
          user_id: newUserId,
          currency: 'USDT',
          balance: 0,
          mining_balance: 0,
          profit_balance: 0,
          is_active: true,
        },
        { onConflict: 'user_id, currency' }
      );

      // 5. Link referral if referral code was provided
      if (referralCode) {
        try {
          await referralService.linkReferral(newUserId, referralCode);
        } catch (refErr) {
          console.warn('Referral link error on signup:', refErr);
        }
      }

      // 6. Record security telemetry event
      await securityService.recordSecurityEvent({
        userId: newUserId,
        userEmail: cleanEmail,
        eventType: 'registration_success',
        status: 'success',
        authMethod: cleanPhone ? 'mobile_or_email' : 'email_password',
        details: { auto_confirmed: true, phone_number: cleanPhone, referral_code: referralCode || null },
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully with instant auto-verification.',
        data: {
          userId: newUserId,
          email: cleanEmail,
          phoneNumber: cleanPhone,
          fullName: name,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/resolve-identifier
   * Resolve an email or mobile phone number to the corresponding auth email
   */
  async resolveIdentifier(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { identifier } = req.body;

      if (!identifier || typeof identifier !== 'string') {
        res.status(400).json({
          success: false,
          error: 'An email address or mobile phone number is required.',
        });
        return;
      }

      const trimmed = identifier.trim();

      // If identifier is already an email format
      if (trimmed.includes('@')) {
        res.status(200).json({
          success: true,
          data: {
            email: trimmed.toLowerCase(),
            isPhone: false,
          },
        });
        return;
      }

      // Identifier is a phone number
      const digitsOnly = trimmed.replace(/[^0-9]/g, '');

      if (digitsOnly.length < 5) {
        res.status(400).json({
          success: false,
          error: 'Please enter a valid mobile number or email address.',
        });
        return;
      }

      // 1. Search profiles table by phone_number
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, phone_number, full_name')
        .or(`phone_number.eq.${trimmed},phone_number.eq.+${digitsOnly},phone_number.eq.${digitsOnly},phone_number.ilike.%${digitsOnly}%`)
        .limit(1)
        .maybeSingle();

      if (profile && profile.email) {
        res.status(200).json({
          success: true,
          data: {
            email: profile.email,
            phoneNumber: profile.phone_number,
            isPhone: true,
          },
        });
        return;
      }

      // 2. Fallback: check if mobile-based user email exists
      const fallbackEmail = `${digitsOnly}@quibands.user`;
      res.status(200).json({
        success: true,
        data: {
          email: fallbackEmail,
          phoneNumber: trimmed,
          isPhone: true,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
