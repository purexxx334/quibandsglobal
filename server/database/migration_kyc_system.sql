-- ==============================================================================
-- QUIBANDS GLOBAL - KYC VERIFICATION & ENHANCED PROFILE SYSTEM
-- ==============================================================================
-- Safe Incremental Migration for Supabase SQL Editor
-- ==============================================================================

-- 1. Extend profiles table with KYC status and address fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(32) NOT NULL DEFAULT 'NOT_SUBMITTED',
  ADD COLUMN IF NOT EXISTS country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS postal_code VARCHAR(32),
  ADD COLUMN IF NOT EXISTS dob VARCHAR(32),
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(32);

-- 2. Create kyc_submissions table
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type VARCHAR(32) NOT NULL, -- 'PASSPORT', 'NATIONAL_ID', 'DRIVERS_LICENSE'
    document_number VARCHAR(64) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dob VARCHAR(32) NOT NULL,
    country VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    postal_code VARCHAR(32),
    id_front_url TEXT NOT NULL, -- image / document data URL or cloud URL
    id_back_url TEXT,
    selfie_url TEXT NOT NULL,   -- selfie photo holding ID
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'REJECTED'
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON public.kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON public.kyc_submissions(status);
CREATE INDEX IF NOT EXISTS idx_kyc_created_at ON public.kyc_submissions(created_at DESC);

-- 4. Enable RLS on kyc_submissions
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view own KYC submissions" ON public.kyc_submissions;
    CREATE POLICY "Users can view own KYC submissions"
        ON public.kyc_submissions FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id OR public.is_admin(auth.uid()) OR auth.role() = 'service_role');

    DROP POLICY IF EXISTS "Users can create own KYC submissions" ON public.kyc_submissions;
    CREATE POLICY "Users can create own KYC submissions"
        ON public.kyc_submissions FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Admins and service_role can manage KYC submissions" ON public.kyc_submissions;
    CREATE POLICY "Admins and service_role can manage KYC submissions"
        ON public.kyc_submissions FOR ALL
        TO authenticated
        USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
        WITH CHECK (public.is_admin(auth.uid()) OR auth.role() = 'service_role');
END $$;
