import { supabaseAdmin } from '../config/supabase';

export interface ReferralUserSummary {
  id: string;
  email: string;
  username: string;
  joinedAt: string;
  status: string;
  commissionEarned: number;
}

export interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  totalEarnings: number;
  commissionRatePercent: number;
  referredUsers: ReferralUserSummary[];
}

export class ReferralService {
  /**
   * Get user's referral code, link, and active referrals list
   */
  async getReferralData(userId: string): Promise<ReferralData> {
    // 1. Fetch user profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    if (profileErr || !profile) {
      throw new Error(`Profile not found for user: ${userId}`);
    }

    let referralCode = profile.referral_code;
    if (!referralCode) {
      // Auto-generate if missing
      referralCode = 'QUIB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      await supabaseAdmin
        .from('profiles')
        .update({ referral_code: referralCode })
        .eq('auth_user_id', userId);
    }

    const appUrl = process.env.APP_URL || (process.env.NODE_ENV === 'production' ? 'https://quibandsglobal.com' : 'http://localhost:5173');
    const referralLink = `${appUrl}/?ref=${referralCode}`;


    // 2. Fetch referred users from referrals table
    const { data: referrals } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    // Also fetch users who have referred_by = userId in profiles
    const { data: directProfiles } = await supabaseAdmin
      .from('profiles')
      .select('auth_user_id, email, username, created_at, account_status')
      .eq('referred_by', userId);

    const referredMap = new Map<string, ReferralUserSummary>();

    directProfiles?.forEach((p) => {
      referredMap.set(p.auth_user_id, {
        id: p.auth_user_id,
        email: p.email ? p.email.replace(/(.{2})(.*)(?=@)/, '$1***') : 'Anonymous Trader',
        username: p.username || 'Affiliate User',
        joinedAt: p.created_at,
        status: p.account_status || 'active',
        commissionEarned: 0,
      });
    });

    referrals?.forEach((r) => {
      const existing = referredMap.get(r.referred_user_id);
      if (existing) {
        existing.commissionEarned += Number(r.commission_earned || 0);
      } else {
        referredMap.set(r.referred_user_id, {
          id: r.referred_user_id,
          email: 'Affiliate #' + r.referred_user_id.substring(0, 6),
          username: 'Trader #' + r.referred_user_id.substring(0, 4),
          joinedAt: r.created_at,
          status: r.status || 'ACTIVE',
          commissionEarned: Number(r.commission_earned || 0),
        });
      }
    });

    const referredUsers = Array.from(referredMap.values());
    const totalEarnings = Number(profile.referral_earnings || 0) + referredUsers.reduce((sum, u) => sum + u.commissionEarned, 0);

    return {
      referralCode,
      referralLink,
      totalReferrals: referredUsers.length,
      totalEarnings,
      commissionRatePercent: 10, // 10% instant affiliate commission
      referredUsers,
    };
  }

  /**
   * Link user to a referrer upon registration
   */
  async linkReferral(newUserId: string, referralCode: string): Promise<void> {
    if (!referralCode || !referralCode.trim()) return;

    const code = referralCode.trim().toUpperCase();

    // Find referrer profile
    const { data: referrer, error } = await supabaseAdmin
      .from('profiles')
      .select('auth_user_id, referral_code')
      .ilike('referral_code', code)
      .maybeSingle();

    if (error || !referrer || referrer.auth_user_id === newUserId) {
      return; // Invalid or self-referral
    }

    // Update new user's referred_by
    await supabaseAdmin
      .from('profiles')
      .update({ referred_by: referrer.auth_user_id })
      .eq('auth_user_id', newUserId);

    // Insert into referrals table
    await supabaseAdmin
      .from('referrals')
      .upsert(
        {
          referrer_id: referrer.auth_user_id,
          referred_user_id: newUserId,
          referral_code: code,
          status: 'ACTIVE',
        },
        { onConflict: 'referred_user_id' }
      );
  }
}

export const referralService = new ReferralService();
