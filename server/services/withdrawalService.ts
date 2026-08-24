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
    const cleanAddress = (destinationWalletAddress || (bankDetails?.account_number ? `${bankDetails.bank_name || 'Bank'}: ${bankDetails.account_holder || ''} - ${bankDetails.account_number}` : 'Bank Wire')).trim();

    // 1. Calculate net amount (100% of balance is credited in full to user bank account)
    const feeAmount = 0;
    const netAmount = Number(amount.toFixed(2));

    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive.');
    }

    // 2. Persist Bank Details to user profile if provided
    if (bankDetails && bankDetails.account_number) {
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('metadata')
        .eq('auth_user_id', userId)
        .maybeSingle();

      const existingMeta = existing?.metadata || {};
      await supabaseAdmin
        .from('profiles')
        .update({
          metadata: {
            ...existingMeta,
            bank_details: bankDetails,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', userId);
    }

    // 3. Handle Convert Balance vs Main Balance
    const isConvertWithdrawal = cleanAsset.includes('MINE') || cleanAsset === 'CONVERT' || params.metadata?.sourceBalance === 'convert';

    let walletId: string | null = null;
    let availableBalance = 0;

    if (isConvertWithdrawal) {
      const { data: userProf } = await supabaseAdmin
        .from('profiles')
        .select('convert_balance, convert_currency')
        .eq('auth_user_id', userId)
        .maybeSingle();

      const userConvBal = Number(userProf?.convert_balance || 0);
      if (userConvBal < amount) {
        throw new Error(`Insufficient convert balance. Required: ${amount}, Available: ${userConvBal.toFixed(2)}. Please convert assets first.`);
      }

      // Deduct / lock convert balance
      await supabaseAdmin
        .from('profiles')
        .update({
          convert_balance: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', userId);
    } else {
      // Main Balance (USDT wallet)
      let { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .ilike('currency', 'USDT')
        .maybeSingle();

      if (!wallet) {
        const { data: newWallet, error: createWalletErr } = await supabaseAdmin
          .from('wallets')
          .insert({
            user_id: userId,
            currency: 'USDT',
            balance: 0,
            locked_balance: 0,
            is_active: true,
          })
          .select('*')
          .single();

        if (createWalletErr || !newWallet) {
          throw new Error(`Unable to initialize wallet: ${createWalletErr?.message || 'Unknown error'}`);
        }
        wallet = newWallet;
      }

      availableBalance = Number(wallet.balance || 0);
      if (availableBalance < amount) {
        throw new Error(`Insufficient main balance. Required: $${amount}, Available: $${availableBalance.toFixed(2)}.`);
      }

      walletId = wallet.id;
      const newLocked = Number(wallet.locked_balance || 0) + amount;

      await supabaseAdmin
        .from('wallets')
        .update({
          balance: 0,
          locked_balance: newLocked,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id);
    }

    // 4. Insert withdrawal request
    const { data: withdrawal, error: insertErr } = await supabaseAdmin
      .from('withdrawal_requests')
      .insert({
        user_id: userId,
        wallet_id: walletId,
        asset: cleanAsset,
        network: cleanNetwork || 'Bank Rail',
        destination_wallet_address: cleanAddress,
        amount: amount,
        fee_amount: feeAmount,
        net_amount: netAmount,
        local_currency: localCurrency || (bankDetails?.currency || 'USD'),
        conversion_rate: conversionRate || 1.0,
        converted_amount: convertedAmount || amount,
        payout_method: payoutMethod || 'BANK_TRANSFER',
        bank_details: bankDetails || {},
        hbc_vbc_code: hbcVbcCode || '',
        gas_fee_paid: true,
        gas_fee_status: 'PENDING',
        tier_upgrade_status: 'NONE',
        status: 'PENDING' as WithdrawalStatus,
        metadata: {
          ...metadata,
          sourceBalance: isConvertWithdrawal ? 'convert' : 'main',
        },
      })
      .select()
      .single();

    if (insertErr || !withdrawal) {
      // Rollback on failure
      if (isConvertWithdrawal) {
        await supabaseAdmin
          .from('profiles')
          .update({ convert_balance: amount })
          .eq('auth_user_id', userId);
      } else if (walletId) {
        await supabaseAdmin
          .from('wallets')
          .update({ balance: availableBalance })
          .eq('id', walletId);
      }
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
      // Mark as APPROVED with optional admin remark
      await supabaseAdmin
        .from('withdrawal_requests')
        .update({
          gas_fee_status: 'APPROVED',
          gas_fee_paid: true,
          status: 'APPROVED',
          rejection_reason: reason || 'Approved & Dispatched by Compliance',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      await supabaseAdmin.from('audit_logs').insert({
        actor_id: adminId,
        action: 'WITHDRAWAL_APPROVED',
        target_id: withdrawalId,
        details: { withdrawal_id: withdrawalId, user_id: req.user_id, amount: req.amount, reason },
      });

      await supabaseAdmin.from('user_notifications').insert({
        user_id: req.user_id,
        title: 'Withdrawal Approved',
        message: `Your bank withdrawal of ${req.amount} ${req.asset} has been approved and cleared by Compliance! ${reason ? `Remark: ${reason}` : ''}`,
        type: 'withdrawal_approved',
        data: { withdrawal_id: withdrawalId },
      });

      return { success: true, message: 'Withdrawal approved successfully.', status: 'APPROVED' };
    } else {
      // REJECT ACTION: RESTORE USER BALANCE AUTOMATICALLY
      const isConvert = req.asset?.includes('MINE') || req.asset === 'CONVERT' || req.metadata?.sourceBalance === 'convert';

      if (isConvert) {
        // Restore convert balance on profile
        const { data: userProf } = await supabaseAdmin
          .from('profiles')
          .select('convert_balance')
          .eq('auth_user_id', req.user_id)
          .maybeSingle();

        const currentConv = Number(userProf?.convert_balance || 0);
        await supabaseAdmin
          .from('profiles')
          .update({
            convert_balance: +(currentConv + Number(req.amount)).toFixed(2),
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', req.user_id);
      } else {
        // Restore Main balance on wallet
        const { data: wallet } = await supabaseAdmin
          .from('wallets')
          .select('*')
          .eq('id', req.wallet_id)
          .maybeSingle();

        if (wallet) {
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
      }

      await supabaseAdmin
        .from('withdrawal_requests')
        .update({
          gas_fee_status: 'REJECTED',
          status: 'REJECTED',
          rejection_reason: reason || 'Withdrawal rejected (Wrong HBC or VBC code).',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      await supabaseAdmin.from('audit_logs').insert({
        actor_id: adminId,
        action: 'WITHDRAWAL_REJECTED_BALANCE_RESTORED',
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
        title: 'Withdrawal Rejected & Balance Restored',
        message: `Your withdrawal of ${req.amount} ${req.asset} was rejected. Reason: ${reason || 'Invalid HBC or VBC Code'}. Your full balance has been restored to your account.`,
        type: 'withdrawal_rejected',
        data: { withdrawal_id: withdrawalId, reason },
      });

      return { success: true, message: 'Withdrawal rejected and balance restored.', status: 'REJECTED' };
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
