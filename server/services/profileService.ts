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
   * Sync active live mining balance to database
   */
  async syncMiningState(
    userId: string,
    miningBalance: number
  ): Promise<{ success: boolean; mining_balance: number }> {
    const newMiningBal = Number(miningBalance || 0);
    const nowIso = new Date().toISOString();

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('metadata')
      .eq('auth_user_id', userId)
      .maybeSingle();

    const existingMeta = profile?.metadata || {};
    const newMeta = {
      ...existingMeta,
      mining_last_synced_at: nowIso,
    };

    await supabaseAdmin
      .from('profiles')
      .update({
        mining_balance: newMiningBal,
        metadata: newMeta,
        updated_at: nowIso,
      })
      .eq('auth_user_id', userId);

    return {
      success: true,
      mining_balance: newMiningBal,
    };
  }

}

export const profileService = new ProfileService();
