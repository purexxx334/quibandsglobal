import { supabaseAdmin } from '../config/supabase';
import { UserDossier, UserProfile, UserRole, Wallet, Transaction } from '../types';
import { securityService } from './securityService';
import { notificationService } from './notificationService';

export class UserManagementService {
  /**
   * Get a complete comprehensive dossier for an individual user
   */
  async getUserDossier(userId: string): Promise<UserDossier> {
    // 1. Get Auth User metadata from Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authError || !authData.user) {
      throw new Error(`Auth user not found: ${authError?.message || 'Unknown error'}`);
    }
    const authUser = authData.user;

    // 2. Get Profile record
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle();

    // 3. Get Role
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    let role: UserRole = 'user';
    if (roles && roles.length > 0) {
      if (roles.some((r) => r.role === 'admin')) role = 'admin';
      else if (roles.some((r) => r.role === 'moderator')) role = 'moderator';
    }

    // 4. Get Wallets
    const { data: wallets } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId);

    // 5. Get Recent Transactions
    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    // 6. Get Security Logs
    const { data: securityLogs } = await supabaseAdmin
      .from('security_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    // 7. Get Audit Logs
    const { data: auditLogs } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    return {
      profile: profile || {
        id: 'auto-generated',
        auth_user_id: userId,
        full_name: authUser.user_metadata?.full_name || '',
        username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || '',
        email: authUser.email || '',
        phone_number: authUser.phone || null,
        account_status: 'active',
        created_at: authUser.created_at,
        updated_at: authUser.created_at,
        role,
      },
      authMetadata: {
        id: authUser.id,
        email: authUser.email || '',
        phone: authUser.phone || null,
        emailConfirmed: Boolean(authUser.email_confirmed_at),
        phoneConfirmed: Boolean(authUser.phone_confirmed_at),
        lastSignInAt: authUser.last_sign_in_at || null,
        createdAt: authUser.created_at,
        bannedUntil: (authUser as any).banned_until || null,
      },
      role,
      wallets: wallets || [],
      recentTransactions: transactions || [],
      recentSecurityLogs: securityLogs || [],
      recentAuditLogs: auditLogs || [],
    };
  }

  /**
   * Suspend a user account & revoke all active sessions
   */
  async suspendAccount(userId: string, adminId: string, reason: string): Promise<void> {
    // 1. Update Profile Status
    await supabaseAdmin
      .from('profiles')
      .update({
        account_status: 'suspended',
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', userId);

    // 2. Revoke Supabase Auth sessions (force logout)
    try {
      await supabaseAdmin.auth.admin.signOut(userId);
    } catch (e: any) {
      console.warn('Session revocation notice:', e.message);
    }

    // 3. Log Audit & Security telemetry
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'ADMIN_SUSPEND_USER',
      entity_type: 'profiles',
      entity_id: userId,
      details: { target_user_id: userId, reason },
    });

    await securityService.recordSecurityEvent({
      userId,
      eventType: 'account_suspended',
      status: 'warning',
      details: { suspended_by: adminId, reason },
    });
  }

  /**
   * Reactivate a suspended user account
   */
  async reactivateAccount(userId: string, adminId: string, reason: string): Promise<void> {
    await supabaseAdmin
      .from('profiles')
      .update({
        account_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', userId);

    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'ADMIN_REACTIVATE_USER',
      entity_type: 'profiles',
      entity_id: userId,
      details: { target_user_id: userId, reason },
    });

    await notificationService.createNotification({
      title: 'Account Reactivated',
      message: `User account ${userId} has been reactivated.`,
      severity: 'info',
      event_type: 'ACCOUNT_REACTIVATED',
      related_user_id: userId,
    });
  }

  /**
   * Flag or unflag a user account for review
   */
  async setAccountFlag(
    userId: string,
    isFlagged: boolean,
    flagReason: string,
    adminId: string
  ): Promise<void> {
    await supabaseAdmin
      .from('profiles')
      .update({
        is_flagged: isFlagged,
        flag_reason: isFlagged ? flagReason : null,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', userId);

    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: isFlagged ? 'ADMIN_FLAG_USER' : 'ADMIN_UNFLAG_USER',
      entity_type: 'profiles',
      entity_id: userId,
      details: { target_user_id: userId, flagReason },
    });

    await notificationService.createNotification({
      title: isFlagged ? 'Account Flagged for Review' : 'Account Flag Cleared',
      message: `User ${userId} was ${isFlagged ? 'flagged: ' + flagReason : 'unflagged'}`,
      severity: isFlagged ? 'warning' : 'info',
      event_type: isFlagged ? 'ACCOUNT_FLAGGED' : 'ACCOUNT_UNFLAGGED',
      related_user_id: userId,
    });
  }

  /**
   * Force revoke all active user sessions (Force Logout)
   */
  async forceRevokeSessions(userId: string, adminId: string, reason: string): Promise<void> {
    await supabaseAdmin.auth.admin.signOut(userId);

    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'ADMIN_FORCE_LOGOUT',
      entity_type: 'auth.users',
      entity_id: userId,
      details: { target_user_id: userId, reason },
    });

    await securityService.recordSecurityEvent({
      userId,
      eventType: 'session_revoked',
      status: 'warning',
      details: { revoked_by: adminId, reason },
    });
  }

  /**
   * Trigger secure password reset link
   */
  async generatePasswordResetLink(userId: string, adminId: string): Promise<string> {
    const { data: authData, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !authData.user || !authData.user.email) {
      throw new Error(`Failed to find user email for password reset.`);
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: authData.user.email,
    });

    if (linkError) {
      throw new Error(`Failed to generate password reset link: ${linkError.message}`);
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'ADMIN_TRIGGER_PASSWORD_RESET',
      entity_type: 'auth.users',
      entity_id: userId,
      details: { target_email: authData.user.email },
    });

    await securityService.recordSecurityEvent({
      userId,
      userEmail: authData.user.email,
      eventType: 'password_reset_request',
      status: 'success',
      details: { initiated_by: 'admin', admin_id: adminId },
    });

    return linkData.properties?.action_link || 'Reset link dispatched.';
  }

  /**
   * Send Password Reset Email directly to user's inbox
   */
  async sendPasswordResetEmail(userId: string, adminId: string): Promise<void> {
    const { data: authData, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !authData.user || !authData.user.email) {
      throw new Error(`Failed to find user email for password reset.`);
    }

    const { error: resetErr } = await supabaseAdmin.auth.resetPasswordForEmail(authData.user.email, {
      redirectTo: `${process.env.APP_URL || 'http://localhost:5173'}/reset-password`,
    });

    if (resetErr) {
      throw new Error(`Failed to dispatch password reset email: ${resetErr.message}`);
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'ADMIN_SEND_PASSWORD_RESET_EMAIL',
      entity_type: 'auth.users',
      entity_id: userId,
      details: { target_email: authData.user.email },
    });
  }

  /**
   * Directly override user password (Secure Admin Operation)
   */
  async directSetPassword(userId: string, newPassword: string, adminId: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }

    // Save temporary password indicator for admin reference
    await supabaseAdmin
      .from('profiles')
      .update({
        temp_password: newPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', userId);

    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'ADMIN_OVERRIDE_PASSWORD',
      entity_type: 'auth.users',
      entity_id: userId,
      details: { target_user_id: userId },
    });

    await notificationService.createNotification({
      title: 'User Password Changed by Admin',
      message: `Password for user ${userId} was overridden by an administrator.`,
      severity: 'warning',
      event_type: 'PASSWORD_RESET_COMPLETION',
      related_user_id: userId,
    });
  }

  /**
   * Terminate and permanently purge a user account
   */
  async terminateAccount(userId: string, adminId: string, reason: string): Promise<void> {
    // 1. Force revoke all sessions
    try {
      await supabaseAdmin.auth.admin.signOut(userId);
    } catch (e) {
      // session signOut ignore
    }

    // 2. Delete Supabase Auth User (Cascades to linked profile data or clean up manually)
    await supabaseAdmin.from('wallets').delete().eq('user_id', userId);
    await supabaseAdmin.from('deposit_requests').delete().eq('user_id', userId);
    await supabaseAdmin.from('withdrawal_requests').delete().eq('user_id', userId);
    await supabaseAdmin.from('kyc_submissions').delete().eq('user_id', userId);
    await supabaseAdmin.from('profiles').delete().eq('auth_user_id', userId);

    const { error: deleteAuthErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthErr) {
      console.warn(`Auth user delete notice: ${deleteAuthErr.message}`);
    }

    // 3. Log Audit
    await supabaseAdmin.from('audit_logs').insert({
      user_id: adminId,
      action: 'ADMIN_TERMINATE_USER',
      entity_type: 'auth.users',
      entity_id: userId,
      details: { target_user_id: userId, reason },
    });

    await securityService.recordSecurityEvent({
      userId,
      eventType: 'account_terminated',
      status: 'critical',
      details: { terminated_by: adminId, reason },
    });
  }


  /**
   * Create an audited financial balance adjustment
   */
  async adjustUserBalance(params: {
    userId: string;
    currency: string;
    amount: number;
    adjustmentType: 'credit' | 'debit';
    reason: string;
    adminId: string;
  }): Promise<Wallet> {
    // 1. Fetch or initialize wallet
    let { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', params.userId)
      .eq('currency', params.currency.toUpperCase())
      .maybeSingle();

    if (!wallet) {
      const { data: newWallet, error: createError } = await supabaseAdmin
        .from('wallets')
        .insert({
          user_id: params.userId,
          currency: params.currency.toUpperCase(),
          available_balance: 0,
        })
        .select()
        .single();

      if (createError) throw new Error(`Failed to initialize wallet: ${createError.message}`);
      wallet = newWallet;
    }

    const currentBalance = Number(wallet.available_balance) || 0;
    const delta = params.adjustmentType === 'credit' ? Math.abs(params.amount) : -Math.abs(params.amount);
    const newBalance = currentBalance + delta;

    if (newBalance < 0) {
      throw new Error(`Adjustment would result in negative balance ($${newBalance.toFixed(2)}). Operation rejected.`);
    }

    // 2. Update wallet
    const { data: updatedWallet, error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({
        available_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id)
      .select()
      .single();

    if (updateError) throw new Error(`Failed to update balance: ${updateError.message}`);

    // 3. Record transaction ledger entry
    await supabaseAdmin.from('transactions').insert({
      user_id: params.userId,
      type: 'adjustment',
      asset: params.currency.toUpperCase(),
      network: 'INTERNAL_LEDGER',
      amount: delta,
      status: 'settled',
      admin_notes: `Manual adjustment by admin (${params.adminId}): ${params.reason}`,
      created_by: params.adminId,
    });

    // 4. Record audit log
    await supabaseAdmin.from('audit_logs').insert({
      user_id: params.adminId,
      action: 'ADMIN_FINANCIAL_ADJUSTMENT',
      entity_type: 'wallets',
      entity_id: wallet.id,
      details: {
        target_user_id: params.userId,
        previous_balance: currentBalance,
        new_balance: newBalance,
        delta,
        reason: params.reason,
      },
    });

    return updatedWallet;
  }
}

export const userManagementService = new UserManagementService();
