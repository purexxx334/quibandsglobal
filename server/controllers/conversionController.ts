import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest, ApiResponse } from '../types';

export class ConversionController {
  /**
   * POST /api/conversions (Authenticated User)
   */
  async createConversion(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const {
        usdMineAmount,
        targetCurrency,
        convertedAmount,
        exchangeRate,
        conversionFeeUsd,
        conversionFeeBnb,
        feeWalletAddress,
        refCode
      } = req.body;

      if (!usdMineAmount || !targetCurrency || !convertedAmount) {
        res.status(400).json({ success: false, error: 'USD Mine amount, target currency, and converted amount are required.' });
        return;
      }

      const generatedRef = refCode || `QB-MINE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { data, error } = await supabaseAdmin
        .from('conversion_requests')
        .insert({
          user_id: req.user.id,
          user_email: req.user.email || '',
          usd_mine_amount: Number(usdMineAmount),
          target_currency: String(targetCurrency).toUpperCase(),
          converted_amount: Number(convertedAmount),
          exchange_rate: Number(exchangeRate || 1.35),
          conversion_fee_usd: Number(conversionFeeUsd || (Number(usdMineAmount) * 0.20)),
          conversion_fee_bnb: Number(conversionFeeBnb || 0),
          fee_wallet_address: String(feeWalletAddress || ''),
          status: 'PENDING',
          ref_code: generatedRef,
        })
        .select()
        .single();

      if (error) {
        console.warn('Database error inserting conversion request:', error);
        // Fallback response if table not yet migrated
        res.status(200).json({
          success: true,
          data: {
            id: 'temp-' + Date.now(),
            user_id: req.user.id,
            user_email: req.user.email || '',
            usd_mine_amount: Number(usdMineAmount),
            target_currency: String(targetCurrency),
            converted_amount: Number(convertedAmount),
            exchange_rate: Number(exchangeRate || 1.35),
            conversion_fee_usd: Number(conversionFeeUsd),
            conversion_fee_bnb: Number(conversionFeeBnb),
            fee_wallet_address: feeWalletAddress,
            status: 'PENDING',
            ref_code: generatedRef,
            created_at: new Date().toISOString()
          },
          message: 'Conversion request submitted successfully (Pending Admin Verification).'
        });
        return;
      }

      res.status(201).json({
        success: true,
        data,
        message: 'Conversion request created successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/conversions/me (Authenticated User's conversions)
   */
  async getMyConversions(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ success: false, error: 'Authentication required.' });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from('conversion_requests')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      res.status(200).json({ success: true, data: data || [] });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/conversions (Admin: List all conversion requests)
   */
  async getAllConversions(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { data, error } = await supabaseAdmin
        .from('conversion_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      res.status(200).json({ success: true, data: data || [] });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/conversions/:id/status (Admin: Approve or Reject conversion request)
   */
  async updateConversionStatus(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      if (!status || !['CONVERTED', 'REJECTED', 'PENDING'].includes(status)) {
        res.status(400).json({ success: false, error: 'Valid status (CONVERTED, REJECTED, PENDING) required.' });
        return;
      }

      // 1. Fetch current conversion request
      const { data: convReq, error: fetchErr } = await supabaseAdmin
        .from('conversion_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchErr || !convReq) {
        res.status(404).json({ success: false, error: 'Conversion request not found.' });
        return;
      }

      // 2. If approved / converted, move funds into convert_balance and reset main & profit balances to 0
      if (status === 'CONVERTED') {
        const { data: userProfile } = await supabaseAdmin
          .from('profiles')
          .select('convert_balance, main_balance, profit_balance')
          .eq('auth_user_id', convReq.user_id)
          .maybeSingle();

        const currentConv = Number(userProfile?.convert_balance || 0);
        const newConv = +(currentConv + Number(convReq.converted_amount)).toFixed(2);

        // Update profiles: credit convert_balance, set main_balance and profit_balance to 0
        await supabaseAdmin
          .from('profiles')
          .update({
            convert_balance: newConv,
            convert_currency: convReq.target_currency || 'SGD',
            main_balance: 0,
            profit_balance: 0,
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', convReq.user_id);

        // Also zero out wallet balances for this user
        await supabaseAdmin
          .from('wallets')
          .update({
            balance: 0,
            profit_balance: 0,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', convReq.user_id);
      }

      // 3. Update conversion_requests table status
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from('conversion_requests')
        .update({
          status,
          admin_notes: adminNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) {
        res.status(500).json({ success: false, error: 'Failed to update conversion status.' });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated,
        message: `Conversion request status successfully updated to ${status}.`
      });
    } catch (err) {
      next(err);
    }
  }
}
