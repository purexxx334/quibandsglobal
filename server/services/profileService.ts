import { supabaseAdmin } from '../config/supabase';
import { UserProfile, AuthenticatedUser } from '../types';

export class ProfileService {
  /**
   * Get the profile for an authenticated user
   */
  async getProfile(user: AuthenticatedUser): Promise<UserProfile> {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    if (!profile) {
      // Create profile if missing
      const fullName = user.supabaseUser.user_metadata?.full_name || '';
      const username = user.supabaseUser.user_metadata?.username || user.email.split('@')[0];

      const { data: created, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          auth_user_id: user.id,
          email: user.email,
          full_name: fullName,
          username: username,
          account_status: 'active',
          metadata: {
            mining_last_synced_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create missing profile: ${createError.message}`);
      }

      return {
        ...created,
        role: user.role,
      };
    }

    // =========================================================================
    // SERVER-SIDE REAL-TIME OFFLINE MINER ENGINE: EXACT 3% PER HOUR OF CAPITAL
    // Mines continuously 24/7 in real time when user miner is active
    // =========================================================================
    const isMinerStopped = profile.miner_status === 'stopped' || profile.metadata?.miner_status === 'stopped';
    const depositBal = Number(profile.deposit_balance !== undefined && profile.deposit_balance !== null ? profile.deposit_balance : (profile.total_deposited || 0));

    if (depositBal > 0 && !isMinerStopped) {
      const nowMs = Date.now();
      const existingMeta = profile.metadata || {};
      const baseMining = Number(existingMeta.mining_base_balance !== undefined ? existingMeta.mining_base_balance : (profile.mining_balance || 0));
      const miningStartedAt = existingMeta.mining_started_at || profile.created_at || new Date(nowMs).toISOString();
      const startMs = new Date(miningStartedAt).getTime();
      const totalElapsedSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));

      const ratePerSec = (depositBal * 0.03) / 3600; // Exact 3.0% of capital per hour
      const totalAccruedYield = Number((baseMining + (totalElapsedSec * ratePerSec)).toFixed(4));
      
      const currentProfit = Number(profile.profit_balance || 0);
      const calculatedMain = Number((depositBal + totalAccruedYield + currentProfit).toFixed(2));
      const effectiveMain = profile.main_balance !== undefined && Number(profile.main_balance) > 0
        ? Math.max(Number(profile.main_balance), calculatedMain)
        : calculatedMain;

      const newMeta = {
        ...existingMeta,
        mining_base_balance: baseMining,
        mining_started_at: miningStartedAt,
        mining_last_synced_at: new Date(nowMs).toISOString(),
      };

      await supabaseAdmin
        .from('profiles')
        .update({
          mining_balance: totalAccruedYield,
          main_balance: effectiveMain,
          metadata: newMeta,
          updated_at: new Date(nowMs).toISOString(),
        })
        .eq('auth_user_id', user.id);

      profile.mining_balance = totalAccruedYield;
      profile.main_balance = effectiveMain;
      profile.metadata = newMeta;
    }

    return {
      ...profile,
      bank_details: profile.bank_details || profile.metadata?.bank_details,
      role: user.role,
    };
  }


  /**
   * Update profile fields for an authenticated user
   */
  async updateProfile(
    userId: string,
    updates: any
  ): Promise<UserProfile> {
    const { bank_details, ...regularUpdates } = updates;

    let payload: Record<string, any> = {
      ...regularUpdates,
      updated_at: new Date().toISOString(),
    };

    if (bank_details) {
      payload.bank_details = bank_details;

      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('metadata')
        .eq('auth_user_id', userId)
        .maybeSingle();

      const existingMeta = existing?.metadata || {};
      payload.metadata = {
        ...existingMeta,
        bank_details,
      };
    }

    let { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update(payload)
      .eq('auth_user_id', userId)
      .select()
      .single();

    if (error && error.message.includes('bank_details')) {
      delete payload.bank_details;
      const fallback = await supabaseAdmin
        .from('profiles')
        .update(payload)
        .eq('auth_user_id', userId)
        .select()
        .single();
      updated = fallback.data;
      error = fallback.error;
    }

    if (error || !updated) {
      throw new Error(`Failed to update profile: ${error?.message || 'Unknown error'}`);
    }

    return {
      ...updated,
      bank_details: updated.bank_details || updated.metadata?.bank_details || bank_details,
    };
  }

  /**
   * Sync active live mining balance and main balance to database
   */
  async syncMiningState(
    userId: string,
    miningBalance: number
  ): Promise<{ success: boolean; mining_balance: number; main_balance: number }> {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('metadata, deposit_balance, mining_balance, profit_balance, total_deposited')
      .eq('auth_user_id', userId)
      .maybeSingle();

    const depositBal = Number(profile?.deposit_balance !== undefined ? profile.deposit_balance : (profile?.total_deposited || 0));
    const profitBal = Number(profile?.profit_balance || 0);
    const newMiningBal = Number(miningBalance || 0);
    const newMainBal = Number((depositBal + newMiningBal + profitBal).toFixed(2));
    const nowIso = new Date().toISOString();

    const existingMeta = profile?.metadata || {};
    const newMeta = {
      ...existingMeta,
      mining_started_at: existingMeta.mining_started_at || nowIso,
      mining_last_synced_at: nowIso,
    };

    await supabaseAdmin
      .from('profiles')
      .update({
        mining_balance: newMiningBal,
        main_balance: newMainBal,
        metadata: newMeta,
        updated_at: nowIso,
      })
      .eq('auth_user_id', userId);


    return {
      success: true,
      mining_balance: newMiningBal,
      main_balance: newMainBal,
    };
  }

}

export const profileService = new ProfileService();
