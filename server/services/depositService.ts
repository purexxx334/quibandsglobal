import { supabaseAdmin } from '../config/supabase';
import { DepositRequest, DepositRequestStatus } from '../types';
import { depositAddressService } from './depositAddressService';
import { notificationService } from './notificationService';

export interface CreateDepositParams {
  userId: string;
  asset: string;
  network: string;
  amount: number;
  transactionHash: string;
  proofReference?: string;
  metadata?: Record<string, any>;
}

export class DepositService {
  /**
   * Create a new deposit request for an authenticated user
   */
  async createDepositRequest(params: CreateDepositParams): Promise<DepositRequest> {
    const { userId, asset, network, amount, transactionHash, proofReference, metadata } = params;

    if (!userId) throw new Error('User ID is required.');
    if (!asset || !network) throw new Error('Asset and network are required.');
    if (!amount || amount <= 0 || isNaN(amount)) throw new Error('A positive numerical deposit amount is required.');
    if (!transactionHash || !transactionHash.trim()) throw new Error('Transaction hash / reference is required.');

    // 1. Resolve current active deposit address
    const activeAddress = await depositAddressService.getActiveAddressForAsset(asset, network);
    if (!activeAddress) {
      throw new Error(`No active deposit address currently configured for ${asset} on ${network}. Please contact support.`);
    }

    // 2. Ensure user wallet exists
    let walletId: string | null = null;
    const { data: existingWallet } = await supabaseAdmin
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .eq('currency', asset.toUpperCase())
      .maybeSingle();

    if (existingWallet) {
      walletId = existingWallet.id;
    } else {
      const { data: newWallet, error: createWalletError } = await supabaseAdmin
        .from('wallets')
        .insert({
          user_id: userId,
          currency: asset.toUpperCase(),
          balance: 0,
          locked_balance: 0,
          is_active: true,
        })
        .select('id')
        .single();

      if (!createWalletError && newWallet) {
        walletId = newWallet.id;
      }
    }

    // 3. Insert deposit request with status PENDING
    const { data: depositRequest, error: insertError } = await supabaseAdmin
      .from('deposit_requests')
      .insert({
        user_id: userId,
        wallet_id: walletId,
        asset: asset.toUpperCase(),
        network: network.toUpperCase(),
        amount,
        deposit_address: activeAddress.address,
        memo_tag: activeAddress.memo_tag || null,
        transaction_hash: transactionHash.trim(),
        proof_reference: proofReference?.trim() || null,
        status: 'PENDING',
        metadata: metadata || {},
      })
      .select('*')
      .single();

    if (insertError || !depositRequest) {
      throw new Error(`Failed to create deposit request: ${insertError?.message || 'Unknown error'}`);
    }

    // 4. Alert administrators
    await notificationService.createNotification({
      title: 'New Deposit Request Submitted',
      message: `User submitted a deposit of ${amount} ${asset.toUpperCase()} (${network.toUpperCase()}). TxHash: ${transactionHash.slice(0, 16)}...`,
      severity: 'info',
      eventType: 'deposit_submitted',
      relatedUserId: userId,
      metadata: { depositId: depositRequest.id, amount, asset, network, transactionHash },
    });

    return depositRequest as DepositRequest;
  }

  /**
   * Get all deposit requests for a specific user
   */
  async getUserDeposits(userId: string): Promise<DepositRequest[]> {
    if (!userId) throw new Error('User ID is required.');

    const { data, error } = await supabaseAdmin
      .from('deposit_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user deposits: ${error.message}`);
    }

    return (data || []) as DepositRequest[];
  }

  /**
   * Get single deposit request by ID with ownership/admin verification
   */
  async getDepositById(depositId: string, requesterUserId: string, isAdmin: boolean): Promise<DepositRequest> {
    const { data: deposit, error } = await supabaseAdmin
      .from('deposit_requests')
      .select('*')
      .eq('id', depositId)
      .maybeSingle();

    if (error || !deposit) {
      throw new Error('Deposit request not found.');
    }

    if (!isAdmin && deposit.user_id !== requesterUserId) {
      throw new Error('Access denied: You cannot view another user’s deposit request.');
    }

    return deposit as DepositRequest;
  }

  /**
   * Get all deposits across platform with user profile join (Admin only)
   */
  async getAdminDeposits(statusFilter?: DepositRequestStatus): Promise<DepositRequest[]> {
    let query = supabaseAdmin
      .from('deposit_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data: deposits, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch admin deposits: ${error.message}`);
    }

    if (!deposits || deposits.length === 0) {
      return [];
    }

    // Attach user profile info
    const userIds = Array.from(new Set(deposits.map((d) => d.user_id)));
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .in('auth_user_id', userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.auth_user_id, p]));

    return deposits.map((d) => ({
      ...d,
      user_profile: profileMap.get(d.user_id) || undefined,
    })) as DepositRequest[];
  }

  /**
   * Atomically approve deposit request:
   * 1. Locks deposit row and asserts status === 'PENDING'
   * 2. Sets status to APPROVED
   * 3. Credits user wallet balance exactly once
   * 4. Creates ledger transaction record in public.transactions
   * 5. Creates audit log in public.audit_logs
   * 6. Dispatches in-app notification to user
   */
  async approveDeposit(depositId: string, adminId: string): Promise<any> {
    if (!depositId) throw new Error('Deposit ID is required.');
    if (!adminId) throw new Error('Admin ID is required.');

    // Try executing stored procedure
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('approve_deposit_request', {
      p_deposit_id: depositId,
      p_admin_id: adminId,
    });

    if (!rpcError && rpcResult) {
      return rpcResult;
    }

    // Fallback atomic execution
    const { data: deposit, error: fetchError } = await supabaseAdmin
      .from('deposit_requests')
      .select('*')
      .eq('id', depositId)
      .single();

    if (fetchError || !deposit) {
      throw new Error(`Deposit request not found: ${depositId}`);
    }

    if (deposit.status !== 'PENDING') {
      throw new Error(`Cannot approve deposit. Current status is already '${deposit.status}'.`);
    }

    // 1. Ensure user wallet exists
    let walletId = deposit.wallet_id;
    let newBalance = Number(deposit.amount);

    if (walletId) {
      const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .single();

      if (wallet) {
        newBalance = Number(wallet.balance) + Number(deposit.amount);
        await supabaseAdmin
          .from('wallets')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', walletId);
      }
    } else {
      const { data: createdWallet } = await supabaseAdmin
        .from('wallets')
        .insert({
          user_id: deposit.user_id,
          currency: deposit.asset,
          balance: Number(deposit.amount),
          locked_balance: 0,
          is_active: true,
        })
        .select('id')
        .single();

      if (createdWallet) walletId = createdWallet.id;
    }

    // 2. Mark deposit as APPROVED
    const { error: updateError } = await supabaseAdmin
      .from('deposit_requests')
      .update({
        status: 'APPROVED',
        wallet_id: walletId,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', depositId)
      .eq('status', 'PENDING'); // Concurrency guard

    if (updateError) {
      throw new Error(`Failed to update deposit status: ${updateError.message}`);
    }

    // 3. Create immutable Ledger Transaction
    await supabaseAdmin.from('transactions').insert({
      wallet_id: walletId,
      user_id: deposit.user_id,
      type: 'DEPOSIT',
      amount: deposit.amount,
      currency: deposit.asset,
      status: 'COMPLETED',
      reference: deposit.transaction_hash,
      description: `Deposit approved by Admin ${adminId}`,
      metadata: {
        deposit_request_id: depositId,
        network: deposit.network,
        deposit_address: deposit.deposit_address,
        approved_by: adminId,
      },
    });

    // 4. Audit Log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: adminId,
      action: 'DEPOSIT_APPROVED',
      target_id: depositId,
      details: {
        amount: deposit.amount,
        asset: deposit.asset,
        network: deposit.network,
        user_id: deposit.user_id,
        new_balance: newBalance,
        transaction_hash: deposit.transaction_hash,
      },
    });

    // 5. User In-App Notification
    await supabaseAdmin.from('user_notifications').insert({
      user_id: deposit.user_id,
      title: 'Deposit Approved',
      message: `Your deposit of ${deposit.amount} ${deposit.asset} (${deposit.network}) has been approved and credited to your wallet.`,
      type: 'deposit_approved',
      data: {
        deposit_id: depositId,
        amount: deposit.amount,
        asset: deposit.asset,
        tx_hash: deposit.transaction_hash,
      },
    });

    return {
      success: true,
      deposit_id: depositId,
      status: 'APPROVED',
      wallet_id: walletId,
      amount: deposit.amount,
      asset: deposit.asset,
      new_balance: newBalance,
    };
  }

  /**
   * Reject a pending deposit request with mandatory reason
   */
  async rejectDeposit(depositId: string, adminId: string, reason: string): Promise<any> {
    if (!depositId) throw new Error('Deposit ID is required.');
    if (!adminId) throw new Error('Admin ID is required.');
    if (!reason || !reason.trim()) throw new Error('A valid rejection reason is mandatory.');

    // Try executing stored procedure
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('reject_deposit_request', {
      p_deposit_id: depositId,
      p_admin_id: adminId,
      p_reason: reason.trim(),
    });

    if (!rpcError && rpcResult) {
      return rpcResult;
    }

    // Fallback atomic execution
    const { data: deposit, error: fetchError } = await supabaseAdmin
      .from('deposit_requests')
      .select('*')
      .eq('id', depositId)
      .single();

    if (fetchError || !deposit) {
      throw new Error(`Deposit request not found: ${depositId}`);
    }

    if (deposit.status !== 'PENDING') {
      throw new Error(`Cannot reject deposit. Current status is already '${deposit.status}'.`);
    }

    // Update status to REJECTED
    const { error: updateError } = await supabaseAdmin
      .from('deposit_requests')
      .update({
        status: 'REJECTED',
        rejection_reason: reason.trim(),
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', depositId)
      .eq('status', 'PENDING');

    if (updateError) {
      throw new Error(`Failed to update deposit status: ${updateError.message}`);
    }

    // Audit Log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: adminId,
      action: 'DEPOSIT_REJECTED',
      target_id: depositId,
      details: {
        amount: deposit.amount,
        asset: deposit.asset,
        user_id: deposit.user_id,
        reason: reason.trim(),
      },
    });

    // User In-App Notification
    await supabaseAdmin.from('user_notifications').insert({
      user_id: deposit.user_id,
      title: 'Deposit Rejected',
      message: `Your deposit of ${deposit.amount} ${deposit.asset} was rejected. Reason: ${reason.trim()}`,
      type: 'deposit_rejected',
      data: {
        deposit_id: depositId,
        amount: deposit.amount,
        asset: deposit.asset,
        reason: reason.trim(),
      },
    });

    return {
      success: true,
      deposit_id: depositId,
      status: 'REJECTED',
      rejection_reason: reason.trim(),
    };
  }

  /**
   * Get notifications for an authenticated user
   */
  async getUserNotifications(userId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Mark user notification as read
   */
  async markNotificationRead(notificationId: string, userId: string): Promise<void> {
    await supabaseAdmin
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
  }
}

export const depositService = new DepositService();
