import { supabaseAdmin } from '../config/supabase';
import { WithdrawalRequest, WithdrawalStatus, WithdrawalFeeRecord, WithdrawalFeeStatus, UserProfile, BankDetails } from '../types';
import { SystemSettingsService } from './systemSettingsService';

export interface CreateWithdrawalParams {
  userId: string;
  asset: string;
  network: string;
  destinationWalletAddress: string;
  amount: number;
  localCurrency?: string;
  conversionRate?: number;
  convertedAmount?: number;
  payoutMethod?: string;
  bankDetails?: BankDetails;
  hbcVbcCode?: string;
  gasFeeTxHash?: string;
  metadata?: Record<string, any>;
}

export class WithdrawalService {
  /**
   * Create a new redesigned withdrawal request with 20% gas fee, local conversion, and fund locking
   */
  async createWithdrawalRequest(params: CreateWithdrawalParams): Promise<WithdrawalRequest> {
    const {
      userId,
      asset,
      network,
      destinationWalletAddress,
      amount,
      localCurrency,
      conversionRate,
      convertedAmount,
      payoutMethod,
      bankDetails,
      hbcVbcCode,
      gasFeeTxHash,
      metadata,
    } = params;

    if (!userId) throw new Error('User ID is required.');
    if (!asset || !network) throw new Error('Asset and network are required.');
    if (!amount || amount <= 0 || isNaN(amount)) {
      throw new Error('A positive numerical withdrawal amount is required.');
    }

    const cleanAsset = asset.toUpperCase().trim();
    const cleanNetwork = network.trim();
    const cleanAddress = (destinationWalletAddress || (bankDetails?.account_number ? `Bank: ${bankDetails.account_number}` : 'N/A')).trim();

    // 1. Calculate platform gas fee requirement (paid separately/externally to treasury)
    const feeAmount = Number((amount * 0.10).toFixed(8)); // External gas fee requirement
    const netAmount = Number(amount.toFixed(8)); // 100% of balance is credited in full to user bank/address

    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive.');
    }


    // 2. Look up or initialize user wallet
    let { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .ilike('currency', cleanAsset)
      .maybeSingle();

    if (!wallet) {
      const { data: newWallet, error: createWalletErr } = await supabaseAdmin
        .from('wallets')
        .insert({
          user_id: userId,
          currency: cleanAsset,
          balance: 0,
          locked_balance: 0,
          is_active: true,
        })
        .select('*')
        .single();

      if (createWalletErr || !newWallet) {
        throw new Error(`Unable to initialize wallet for ${cleanAsset}: ${createWalletErr?.message || 'Unknown error'}`);
      }
      wallet = newWallet;
    }

    if (!wallet.is_active) {
      throw new Error(`Wallet for ${cleanAsset} is currently suspended or inactive.`);
    }

    const availableBalance = Number(wallet.balance || 0);
    if (availableBalance < amount) {
      throw new Error(`Insufficient available balance. Required: ${amount} ${cleanAsset}, Available: ${availableBalance.toFixed(8)} ${cleanAsset}. Please deposit funds first.`);
    }

    // 3. Atomically update balance to 0 and lock funds pending gas fee review
    const newLocked = Number(wallet.locked_balance || 0) + amount;
    const { error: lockErr } = await supabaseAdmin
      .from('wallets')
      .update({
        balance: 0, // Balance updated to zero as requested
        locked_balance: newLocked,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id);

    if (lockErr) {
      throw new Error(`Failed to update balance: ${lockErr.message}`);
    }

    // 4. Insert withdrawal request
    const { data: withdrawal, error: insertErr } = await supabaseAdmin
      .from('withdrawal_requests')
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        asset: cleanAsset,
        network: cleanNetwork,
        destination_wallet_address: cleanAddress,
        amount: amount,
        fee_amount: feeAmount,
        net_amount: netAmount,
        local_currency: localCurrency || 'USD',
        conversion_rate: conversionRate || 1.0,
        converted_amount: convertedAmount || amount,
        payout_method: payoutMethod || 'BANK_TRANSFER',
        bank_details: bankDetails || {},
        hbc_vbc_code: hbcVbcCode || '',
        gas_fee_paid: !!gasFeeTxHash,
        gas_fee_status: 'PENDING',
        gas_fee_tx_hash: gasFeeTxHash || null,
        tier_upgrade_status: 'NONE',
        status: 'PENDING' as WithdrawalStatus,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (insertErr || !withdrawal) {
      // Rollback on failure
      await supabaseAdmin
        .from('wallets')
        .update({ balance: availableBalance, locked_balance: wallet.locked_balance })
        .eq('id', wallet.id);
      throw new Error(`Failed to create withdrawal request: ${insertErr?.message}`);
    }

    // 5. Insert separate Gas / Fee Record
    await supabaseAdmin
      .from('withdrawal_fee_records')
      .insert({
        withdrawal_id: withdrawal.id,
        user_id: userId,
        asset: cleanAsset,
        fee_type: 'PLATFORM_WITHDRAWAL_FEE',
        fee_amount: feeAmount,
        status: 'PENDING' as WithdrawalFeeStatus,
        notes: `20% Gas Fee for ${cleanAsset} withdrawal. HBC/VBC: ${hbcVbcCode || 'N/A'}`,
      });

    // 6. Audit log & In-app notification
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: userId,
      action: 'WITHDRAWAL_REQUESTED',
      target_id: withdrawal.id,
      details: {
        asset: cleanAsset,
        network: cleanNetwork,
        amount,
        fee_amount: feeAmount,
        net_amount: netAmount,
        payout_method: payoutMethod,
        local_currency: localCurrency,
        converted_amount: convertedAmount,
        gas_fee_tx_hash: gasFeeTxHash,
      },
    });

    await supabaseAdmin.from('user_notifications').insert({
      user_id: userId,
      title: 'Withdrawal & Gas Fee Submitted',
      message: `Your withdrawal of ${amount} ${cleanAsset} (Full Payout: ${amount} ${cleanAsset}) has been submitted. External Gas fee verification is pending.`,
      type: 'withdrawal_pending',
      data: {
        withdrawal_id: withdrawal.id,
        amount,
        fee_amount: feeAmount,
        net_amount: netAmount,
      },
    });


    return withdrawal as WithdrawalRequest;
  }

  /**
   * Get user's own withdrawal history
   */
  async getUserWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
    if (!userId) throw new Error('User ID is required.');

    const { data: withdrawals, error } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user withdrawals: ${error.message}`);
    }

    return (withdrawals || []) as WithdrawalRequest[];
  }

  /**
   * Get single withdrawal by ID with ownership assertion
   */
  async getWithdrawalById(withdrawalId: string, userId?: string, isAdmin: boolean = false): Promise<WithdrawalRequest | null> {
    let query = supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalId);

    if (!isAdmin && userId) {
      query = query.eq('user_id', userId);
    }

    const { data: withdrawal, error } = await query.maybeSingle();
    if (error || !withdrawal) return null;

    // Attach profile info
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('auth_user_id', withdrawal.user_id)
      .maybeSingle();

    return {
      ...withdrawal,
      user_profile: profile || undefined,
    } as WithdrawalRequest;
  }

  /**
   * Get all withdrawals across platform (Admin)
   */
  async getAdminWithdrawals(statusFilter?: string): Promise<WithdrawalRequest[]> {
    let query = supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: withdrawals, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch admin withdrawals: ${error.message}`);
    }

    if (!withdrawals || withdrawals.length === 0) return [];

    const userIds = Array.from(new Set(withdrawals.map((w) => w.user_id)));
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .in('auth_user_id', userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.auth_user_id, p]));

    return withdrawals.map((w) => ({
      ...w,
      user_profile: profileMap.get(w.user_id) || undefined,
    })) as WithdrawalRequest[];
  }

  /**
   * Admin approves or rejects gas fee payment
   * If REJECTED: Automatically restores user's balance back!
   */
  async reviewGasFeePayment(
    withdrawalId: string,
    action: 'APPROVE' | 'REJECT',
    adminId: string,
    reason?: string
  ): Promise<any> {
    const { data: req, error: fetchErr } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (fetchErr || !req) {
      throw new Error(`Withdrawal request not found: ${withdrawalId}`);
    }

    if (action === 'APPROVE') {
      // Mark gas fee as approved and withdrawal as APPROVED
      await supabaseAdmin
        .from('withdrawal_requests')
        .update({
          gas_fee_status: 'APPROVED',
          gas_fee_paid: true,
          status: 'APPROVED',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      await supabaseAdmin
        .from('withdrawal_fee_records')
        .update({
          status: 'APPROVED',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('withdrawal_id', withdrawalId);

      await supabaseAdmin.from('audit_logs').insert({
        actor_id: adminId,
        action: 'GAS_FEE_APPROVED',
        target_id: withdrawalId,
        details: { withdrawal_id: withdrawalId, user_id: req.user_id, amount: req.amount },
      });

      await supabaseAdmin.from('user_notifications').insert({
        user_id: req.user_id,
        title: 'Gas Fee Approved',
        message: `Your 20% gas fee payment for ${req.amount} ${req.asset} has been approved! You may now proceed with the final withdrawal step.`,
        type: 'gas_fee_approved',
        data: { withdrawal_id: withdrawalId },
      });

      return { success: true, message: 'Gas fee payment approved successfully.', status: 'APPROVED' };
    } else {
      // REJECT ACTION: RESTORE USER BALANCE AUTOMATICALLY
      const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('id', req.wallet_id)
        .single();

      if (wallet) {
        // Restore balance and decrement locked_balance
        const restoredBalance = Number(wallet.balance || 0) + Number(req.amount);
        const restoredLocked = Math.max(0, Number(wallet.locked_balance || 0) - Number(req.amount));

        await supabaseAdmin
          .from('wallets')
          .update({
            balance: restoredBalance,
            locked_balance: restoredLocked,
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id);
      }

      await supabaseAdmin
        .from('withdrawal_requests')
        .update({
          gas_fee_status: 'REJECTED',
          status: 'REJECTED',
          rejection_reason: reason || 'Gas fee payment could not be verified.',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      await supabaseAdmin
        .from('withdrawal_fee_records')
        .update({
          status: 'REJECTED',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          notes: reason || 'Gas fee payment rejected by admin.',
          updated_at: new Date().toISOString(),
        })
        .eq('withdrawal_id', withdrawalId);

      await supabaseAdmin.from('audit_logs').insert({
        actor_id: adminId,
        action: 'GAS_FEE_REJECTED_BALANCE_RESTORED',
        target_id: withdrawalId,
        details: {
          withdrawal_id: withdrawalId,
          user_id: req.user_id,
          amount_restored: req.amount,
          reason,
        },
      });

      await supabaseAdmin.from('user_notifications').insert({
        user_id: req.user_id,
        title: 'Gas Fee Payment Rejected',
        message: `Your gas fee payment was rejected (${reason || 'Verification failed'}). Your balance of ${req.amount} ${req.asset} has been automatically restored to your account.`,
        type: 'withdrawal_rejected',
        data: { withdrawal_id: withdrawalId, amount_restored: req.amount },
      });

      return { success: true, message: 'Gas fee rejected and user balance automatically restored.', status: 'REJECTED' };
    }
  }

  /**
   * Submit tier upgrade proof
   */
  async submitTierUpgradeProof(
    userId: string,
    withdrawalId: string,
    tier: string,
    txHash: string
  ): Promise<any> {
    await supabaseAdmin
      .from('withdrawal_requests')
      .update({
        tier_upgrade_status: `PENDING_${tier.toUpperCase()}`,
        metadata: {
          upgrade_tier: tier,
          upgrade_tx_hash: txHash,
          upgrade_submitted_at: new Date().toISOString(),
        },
      })
      .eq('id', withdrawalId)
      .eq('user_id', userId);

    await supabaseAdmin.from('audit_logs').insert({
      actor_id: userId,
      action: 'TIER_UPGRADE_PAYMENT_SUBMITTED',
      target_id: withdrawalId,
      details: { tier, txHash },
    });

    return { success: true, message: 'Account tier upgrade payment submitted for review.' };
  }

  /**
   * Get active system withdrawal and upgrade deposit addresses
   */
  async getWithdrawalSettings(): Promise<any> {
    return await SystemSettingsService.getAllSettings();
  }
}
