import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { supabaseAdmin } from '../config/supabase';

export class TransactionController {
  /**
   * GET /api/transactions/me
   * Retrieve all transaction history records for the current user (deposits, withdrawals, conversions, and manual credits)
   */
  async getMyTransactions(req: AuthenticatedRequest, res: Response<ApiResponse>, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required.' });
      }

      // Fetch in parallel from transactions, deposits, withdrawals, and conversions
      const [txResult, depResult, wdResult, convResult] = await Promise.allSettled([
        supabaseAdmin.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabaseAdmin.from('deposit_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabaseAdmin.from('withdrawal_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabaseAdmin.from('conversion_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);

      const unified: any[] = [];
      const seenIds = new Set<string>();

      // 1. Process standard ledger transactions
      if (txResult.status === 'fulfilled' && txResult.value.data) {
        txResult.value.data.forEach((t) => {
          seenIds.add(String(t.id));
          unified.push({
            id: t.id,
            user_id: t.user_id,
            type: t.type || 'adjustment',
            asset: t.asset || 'USDT',
            network: t.network || 'TRC20',
            amount: Number(t.amount || 0),
            status: t.status || 'confirmed',
            address: t.address,
            tx_hash: t.tx_hash,
            memo: t.memo || t.admin_notes || 'Account Transaction',
            created_at: t.created_at,
            updated_at: t.updated_at || t.created_at,
          });
        });
      }

      // 2. Process deposit requests
      if (depResult.status === 'fulfilled' && depResult.value.data) {
        depResult.value.data.forEach((d) => {
          const depId = `dep-${d.id}`;
          // Only add if not already represented in ledger
          if (!seenIds.has(String(d.id)) && !seenIds.has(depId)) {
            seenIds.add(depId);
            const isApproved = d.status === 'APPROVED';
            const isRejected = d.status === 'REJECTED';
            unified.push({
              id: depId,
              user_id: d.user_id,
              type: 'deposit',
              asset: d.asset || 'USDT',
              network: d.network || 'TRC20',
              amount: Number(d.amount || 0),
              status: isApproved ? 'confirmed' : isRejected ? 'rejected' : 'pending',
              tx_hash: d.transaction_hash,
              memo: d.memo_tag ? `Deposit (${d.asset} • ${d.network}) - Tag: ${d.memo_tag}` : `Crypto Deposit (${d.asset} • ${d.network || 'Native'})`,
              created_at: d.created_at,
              updated_at: d.updated_at || d.created_at,
            });
          }
        });
      }

      // 3. Process withdrawal requests
      if (wdResult.status === 'fulfilled' && wdResult.value.data) {
        wdResult.value.data.forEach((w) => {
          const wdId = `wd-${w.id}`;
          if (!seenIds.has(String(w.id)) && !seenIds.has(wdId)) {
            seenIds.add(wdId);
            const isApproved = w.status === 'APPROVED' || w.status === 'COMPLETED';
            const isRejected = w.status === 'REJECTED';
            unified.push({
              id: wdId,
              user_id: w.user_id,
              type: 'withdrawal',
              asset: w.asset || w.currency || 'USDT',
              network: w.network || 'Native',
              amount: Number(w.amount || 0),
              status: isApproved ? 'confirmed' : isRejected ? 'rejected' : 'pending',
              address: w.destination_address || w.bank_account_number,
              memo: w.bank_name ? `Bank Withdrawal to ${w.bank_name} (${w.currency || 'USD'})` : `Crypto Withdrawal to ${w.destination_address ? w.destination_address.substring(0, 10) + '...' : 'External Wallet'}`,
              created_at: w.created_at,
              updated_at: w.updated_at || w.created_at,
            });
          }
        });
      }

      // 4. Process conversion requests
      if (convResult.status === 'fulfilled' && convResult.value.data) {
        convResult.value.data.forEach((c) => {
          const convId = `conv-${c.id}`;
          if (!seenIds.has(String(c.id)) && !seenIds.has(convId)) {
            seenIds.add(convId);
            const isApproved = c.status === 'APPROVED';
            const isRejected = c.status === 'REJECTED';
            unified.push({
              id: convId,
              user_id: c.user_id,
              type: 'conversion',
              asset: c.target_currency || 'SGD',
              network: 'Instant Settlement',
              amount: Number(c.converted_amount || c.usd_mine_amount || 0),
              status: isApproved ? 'confirmed' : isRejected ? 'rejected' : 'pending',
              memo: `Portfolio Conversion: $${Number(c.usd_mine_amount || 0).toLocaleString()} USD Mined \u2192 ${Number(c.converted_amount || 0).toLocaleString()} ${c.target_currency || 'SGD'} (${c.ref_code || 'Direct'})`,
              created_at: c.created_at,
              updated_at: c.updated_at || c.created_at,
            });
          }
        });
      }

      // Sort all transactions chronologically descending
      unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return res.status(200).json({
        success: true,
        data: unified,
      });
    } catch (err: any) {
      next(err);
    }
  }
}

export const transactionController = new TransactionController();
