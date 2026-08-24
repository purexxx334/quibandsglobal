import { supabaseAdmin } from '../config/supabase';
import { UserProfile, UserRole } from '../types';

export class AdminService {
  /**
   * Get all registered users with their database roles and profiles
   */
  async getAllUsers(): Promise<UserProfile[]> {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      throw new Error(`Failed to list user profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Query roles for all users
    const userIds = profiles.map((p) => p.auth_user_id);
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    if (rolesError) {
      console.warn('Could not fetch all user roles:', rolesError.message);
    }

    const roleMap = new Map<string, UserRole>();
    roles?.forEach((r) => {
      const existing = roleMap.get(r.user_id);
      if (r.role === 'admin' || !existing) {
        roleMap.set(r.user_id, r.role as UserRole);
      }
    });

    // Query main wallet balances for these users to include in user profile preview
    const { data: wallets } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .in('user_id', userIds);

    const walletMap = new Map<string, any>();
    wallets?.forEach((w) => {
      if (!walletMap.has(w.user_id) || w.currency === 'USDT') {
        walletMap.set(w.user_id, w);
      }
    });

    // Query referrals count
    const { data: allReferrals } = await supabaseAdmin
      .from('referrals')
      .select('referrer_id');

    const referralCountMap = new Map<string, number>();
    allReferrals?.forEach((ref) => {
      referralCountMap.set(ref.referrer_id, (referralCountMap.get(ref.referrer_id) || 0) + 1);
    });


    return profiles.map((p) => {
      const userWallet = walletMap.get(p.auth_user_id);
      const mainBal = userWallet ? Number(userWallet.balance || 0) : 0;
      const miningBal = p.mining_balance !== undefined ? Number(p.mining_balance) : (userWallet ? Number(userWallet.mining_balance || 0) : 0);
      const profitBal = p.profit_balance !== undefined ? Number(p.profit_balance) : (userWallet ? Number(userWallet.profit_balance || 0) : 0);
      const totalBal = mainBal + miningBal + profitBal;

      return {
        ...p,
        main_balance: mainBal,
        mining_balance: miningBal,
        profit_balance: profitBal,
        convert_balance: p.convert_balance !== undefined ? Number(p.convert_balance) : 0,
        convert_currency: p.convert_currency || 'SGD',
        total_balance: totalBal,
        receive_limit: p.receive_limit !== undefined ? Number(p.receive_limit) : 9000.00,
        account_tier: p.account_tier || 'BASIC',
        temp_password: p.temp_password || null,
        referral_code: p.referral_code || null,
        referral_earnings: Number(p.referral_earnings || 0),
        referral_count: referralCountMap.get(p.auth_user_id) || 0,
        bank_details: p.bank_details || p.metadata?.bank_details,
        role: roleMap.get(p.auth_user_id) || 'user',
      };
    });
  }


  /**
   * Assign or update a user's role (Admin-only action)
   */
  async setUserRole(targetUserId: string, newRole: UserRole, adminId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        {
          user_id: targetUserId,
          role: newRole,
        },
        { onConflict: 'user_id, role' }
      );

    if (error) {
      throw new Error(`Failed to update user role: ${error.message}`);
    }

    // Log admin action in audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: adminId,
      action: 'ADMIN_SET_USER_ROLE',
      target_id: targetUserId,
      details: { newRole },
    });
  }

  /**
   * Update account status (active, suspended, pending)
   */
  async setUserStatus(targetUserId: string, status: 'active' | 'suspended' | 'pending', adminId: string): Promise<UserProfile> {
    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update({
        account_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', targetUserId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user status: ${error.message}`);
    }

    // Log admin action in audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: adminId,
      action: 'ADMIN_SET_USER_STATUS',
      target_id: targetUserId,
      details: { status },
    });

    return updated as UserProfile;
  }

  /**
   * Edit user balances (Main, Mining, Profit, Convert), remarks, receive limits, and account tier
   */
  async editUserBalancesAndLimits(
    targetUserId: string,
    data: {
      mainBalance?: number;
      miningBalance?: number;
      profitBalance?: number;
      convertBalance?: number;
      convertCurrency?: string;
      receiveLimit?: number;
      accountTier?: string;
      balanceRemark?: string | null;
      miningRemark?: string | null;
      profitRemark?: string | null;
    },
    adminId: string
  ): Promise<any> {
    // 1. Update Profile fields
    const profileUpdate: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.miningBalance !== undefined) profileUpdate.mining_balance = data.miningBalance;
    if (data.profitBalance !== undefined) profileUpdate.profit_balance = data.profitBalance;
    if (data.convertBalance !== undefined) profileUpdate.convert_balance = data.convertBalance;
    if (data.convertCurrency !== undefined) profileUpdate.convert_currency = data.convertCurrency;
    if (data.receiveLimit !== undefined) profileUpdate.receive_limit = data.receiveLimit;
    if (data.accountTier !== undefined) profileUpdate.account_tier = data.accountTier;
    if (data.balanceRemark !== undefined) profileUpdate.balance_remark = data.balanceRemark;
    if (data.miningRemark !== undefined) profileUpdate.mining_remark = data.miningRemark;
    if (data.profitRemark !== undefined) profileUpdate.profit_remark = data.profitRemark;

    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('auth_user_id', targetUserId);

    if (profileErr) {
      console.warn('Profile update warning:', profileErr.message);
    }

    // 2. Update or Initialize Wallet for Main Balance
    let oldMainBalance = 0;
    if (data.mainBalance !== undefined || data.miningBalance !== undefined || data.profitBalance !== undefined) {
      const { data: existingWallet } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('currency', 'USDT')
        .maybeSingle();

      if (existingWallet) {
        oldMainBalance = Number(existingWallet.balance || 0);
        const walletUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
        if (data.mainBalance !== undefined) walletUpdate.balance = data.mainBalance;
        if (data.miningBalance !== undefined) walletUpdate.mining_balance = data.miningBalance;
        if (data.profitBalance !== undefined) walletUpdate.profit_balance = data.profitBalance;

        await supabaseAdmin
          .from('wallets')
          .update(walletUpdate)
          .eq('id', existingWallet.id);
      } else {
        await supabaseAdmin
          .from('wallets')
          .insert({
            user_id: targetUserId,
            currency: 'USDT',
            balance: data.mainBalance !== undefined ? data.mainBalance : 0,
            locked_balance: 0,
            mining_balance: data.miningBalance !== undefined ? data.miningBalance : 0,
            profit_balance: data.profitBalance !== undefined ? data.profitBalance : 0,
            is_active: true,
          });
      }
    }

    // 3. Conditional Transaction History Creation:
    // If the admin provided a remark, create an immutable transaction record showing the exact reason for the balance addition.
    // If NO remark is provided, DO NOT create a transaction record so it won't appear in user transaction history.
    if (data.balanceRemark && data.balanceRemark.trim().length > 0 && data.mainBalance !== undefined) {
      const delta = data.mainBalance - oldMainBalance;
      const transAmount = Math.abs(delta) > 0 ? Math.abs(delta) : data.mainBalance;

      await supabaseAdmin.from('transactions').insert({
        user_id: targetUserId,
        type: delta >= 0 ? 'adjustment' : 'fee',
        asset: 'USDT',
        network: 'SYSTEM_ALLOCATION',
        amount: transAmount,
        status: 'confirmed',
        memo: data.balanceRemark.trim(),
        admin_notes: `Admin Balance Update. Reason: ${data.balanceRemark.trim()}`,
        created_by: adminId,
      });

      // Also create an in-app notification for the user
      await supabaseAdmin.from('user_notifications').insert({
        user_id: targetUserId,
        title: delta >= 0 ? 'Balance Credited' : 'Balance Adjusted',
        message: `${delta >= 0 ? '+' : '-'}$${transAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT has been credited to your account. Reason: ${data.balanceRemark.trim()}`,
        type: 'balance_adjustment',
        data: { amount: delta, remark: data.balanceRemark.trim() },
      });
    }

    // 4. Insert audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: adminId,
      action: 'ADMIN_EDIT_USER_BALANCES_AND_LIMITS',
      target_id: targetUserId,
      details: {
        ...data,
        updated_at: new Date().toISOString(),
      },
    });

    return { success: true, message: 'User balances, limits, and remarks updated successfully.' };
  }
}

