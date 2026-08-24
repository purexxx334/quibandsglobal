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

    let metadataUpdates: Record<string, any> = {};
    if (bank_details) {
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('metadata')
        .eq('auth_user_id', userId)
        .maybeSingle();

      const existingMeta = existing?.metadata || {};
      metadataUpdates = {
        metadata: {
          ...existingMeta,
          bank_details,
        },
      };
    }

    const { data: updated, error } = await supabaseAdmin
      .from('profiles')
      .update({
        ...regularUpdates,
        ...metadataUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('auth_user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return {
      ...updated,
      bank_details: updated.bank_details || updated.metadata?.bank_details || bank_details,
    };
  }

}

export const profileService = new ProfileService();
