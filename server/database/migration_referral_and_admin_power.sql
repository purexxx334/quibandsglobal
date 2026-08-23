-- ==============================================================================
-- QUIBANDS GLOBAL - REFERRAL SYSTEM & ADMIN SECURITY ENHANCEMENTS
-- ==============================================================================

-- 1. Extend profiles with referral and security columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(32) UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000,
  ADD COLUMN IF NOT EXISTS temp_password TEXT;

-- 2. Generate referral codes for any existing users who don't have one
UPDATE public.profiles
SET referral_code = 'QUIB-' || UPPER(SUBSTRING(MD5(id::text || email || RANDOM()::text) FROM 1 FOR 6))
WHERE referral_code IS NULL;

-- 3. Create referrals table for detailed affiliate tracking
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(32) NOT NULL,
    commission_earned NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_referred_user UNIQUE (referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

-- 4. Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
    CREATE POLICY "Users can view their own referrals"
        ON public.referrals FOR SELECT
        TO authenticated
        USING (auth.uid() = referrer_id OR public.is_admin(auth.uid()) OR auth.role() = 'service_role');

    DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.referrals;
    CREATE POLICY "Admins can manage all referrals"
        ON public.referrals FOR ALL
        TO authenticated
        USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
        WITH CHECK (public.is_admin(auth.uid()) OR auth.role() = 'service_role');
END $$;
