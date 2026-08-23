import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { referralService } from '../services/referralService';
import { securityService } from '../services/securityService';
import { ApiResponse } from '../types';

export class AuthController {
  /**
   * POST /api/auth/register (Instant Registration - Zero Email Verification Required)
   */
  async register(req: Request, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { email, password, fullName, referralCode } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required for registration.',
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

      const cleanEmail = email.trim().toLowerCase();
      const name = fullName ? fullName.trim() : cleanEmail.split('@')[0];
      const username = cleanEmail.split('@')[0] + Math.floor(1000 + Math.random() * 9000);

      // 1. Create user in Supabase Auth with email_confirm: true (bypasses any email verification)
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true, // AUTO-VERIFIED IMMEDIATELY
        user_metadata: {
          full_name: name,
          username,
        },
      });

      if (createError) {
        // If user already exists, return friendly message
        if (createError.message?.toLowerCase().includes('already registered')) {
          res.status(400).json({
            success: false,
            error: 'This email is already registered. Please sign in instead.',
          });
          return;
        }
        throw new Error(createError.message);
      }

      const newUserId = userData.user.id;
      const userRefCode = 'QUIB-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      // 2. Insert or update user profile with temp_password and referral_code
      await supabaseAdmin.from('profiles').upsert(
        {
          auth_user_id: newUserId,
          email: cleanEmail,
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
        authMethod: 'email_password',
        details: { auto_confirmed: true, referral_code: referralCode || null },
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully with instant auto-verification.',
        data: {
          userId: newUserId,
          email: cleanEmail,
          fullName: name,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
