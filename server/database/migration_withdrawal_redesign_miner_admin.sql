-- ==============================================================================
-- QUIBANDS GLOBAL - PHASE 4 REDESIGN: WITHDRAWAL SYSTEM, MINER, & ADMIN CONTROLS
-- ==============================================================================
-- Incremental Non-Destructive Migration Script
-- Safe to run directly in Supabase SQL Editor.
-- ==============================================================================

-- 1. HELPER: Ensure is_admin function exists and references public.user_roles
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = check_user_id 
          AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. EXTEND PROFILES TABLE WITH MINING, PROFIT, LIMITS, AND REMARKS
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mining_balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000,
  ADD COLUMN IF NOT EXISTS profit_balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000,
  ADD COLUMN IF NOT EXISTS receive_limit NUMERIC(28, 2) NOT NULL DEFAULT 9000.00,
  ADD COLUMN IF NOT EXISTS account_tier VARCHAR(32) NOT NULL DEFAULT 'BASIC',
  ADD COLUMN IF NOT EXISTS balance_remark TEXT,
  ADD COLUMN IF NOT EXISTS mining_remark TEXT,
  ADD COLUMN IF NOT EXISTS profit_remark TEXT;

-- 3. EXTEND WALLETS TABLE
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS mining_balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000,
  ADD COLUMN IF NOT EXISTS profit_balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000;

-- 4. CREATE SYSTEM SETTINGS TABLE (For Gas Fee Address, Upgrade Address, etc.)
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    network VARCHAR(50) DEFAULT 'TRC20',
    description TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Settings
INSERT INTO public.system_settings (key, value, network, description)
VALUES 
    ('gas_fee_address', 'TYDzsYUEpvnYmQk4zGP9sWWcTEd36AMW9y', 'TRC20', 'Platform Gas Fee Disbursement Vault (20% Withdrawal Fee)'),
    ('tier_upgrade_address', 'TYDzsYUEpvnYmQk4zGP9sWWcTEd36AMW9y', 'TRC20', 'Institutional Account Tier Upgrade Vault (Bronze, Gold, Premium)'),
    ('default_receive_limit', '9000.00', 'USD', 'Default user receiving and withdrawal threshold ($9,000)')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value,
    network = COALESCE(EXCLUDED.network, public.system_settings.network),
    updated_at = NOW();

-- 5. EXTEND WITHDRAWAL REQUESTS TABLE
ALTER TABLE public.withdrawal_requests
  ADD COLUMN IF NOT EXISTS local_currency VARCHAR(16) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC(18, 6) DEFAULT 1.000000,
  ADD COLUMN IF NOT EXISTS converted_amount NUMERIC(28, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payout_method VARCHAR(32) DEFAULT 'BANK_TRANSFER',
  ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS hbc_vbc_code VARCHAR(64),
  ADD COLUMN IF NOT EXISTS gas_fee_paid BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gas_fee_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS gas_fee_tx_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tier_upgrade_status VARCHAR(32) NOT NULL DEFAULT 'NONE';

-- 6. ENABLE ROW LEVEL SECURITY (RLS) FOR SYSTEM SETTINGS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view system settings" ON public.system_settings;
    CREATE POLICY "Public can view system settings"
        ON public.system_settings FOR SELECT
        TO public
        USING (true);

    DROP POLICY IF EXISTS "Admins and service_role can manage system settings" ON public.system_settings;
    CREATE POLICY "Admins and service_role can manage system settings"
        ON public.system_settings FOR ALL
        USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
        WITH CHECK (public.is_admin(auth.uid()) OR auth.role() = 'service_role');
END $$;
