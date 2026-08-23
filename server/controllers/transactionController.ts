import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { supabaseAdmin } from '../config/supabase';

export class TransactionController {
  /**
   * GET /api/transactions/me
   * Retrieve all transaction history records for the current user (deposits, approved disbursements, manual credits with remarks)
   */
  async getMyTransactions(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return res.status(200).json({
        success: true,
        data: data || [],
      });
    } catch (err: any) {
      next(err);
    }
  }
}

export const transactionController = new TransactionController();
