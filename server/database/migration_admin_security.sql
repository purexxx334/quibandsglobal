-- ==============================================================================
-- QUIBANDS GLOBAL - INCREMENTAL MIGRATION (PHASE 2: ADMIN & SECURITY ADDITIONS)
-- This script safely updates your existing database without deleting or altering
-- your existing users, profiles, or user roles!
-- ==============================================================================

-- 1. SAFELY ADD NEW COLUMNS TO EXISTING PROFILES TABLE (IF NOT ALREADY PRESENT)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- Update account_status constraint to allow 'flagged' if needed
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_status_check 
        CHECK (account_status IN ('active', 'suspended', 'pending', 'flagged'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. CREATE NEW TABLES (NON-DESTRUCTIVE: IF NOT EXISTS)

-- 2.1 SECURITY LOGS (LOGIN & TELEMETRY AUDIT)
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'warning')),
    ip_address TEXT,
    geo_location JSONB DEFAULT '{}'::jsonb,
    device_type TEXT,
    operating_system TEXT,
    browser TEXT,
    user_agent TEXT,
    session_id TEXT,
    auth_method TEXT DEFAULT 'email_password',
    risk_score INTEGER DEFAULT 0,
    risk_indicators JSONB DEFAULT '[]'::jsonb,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 ADMIN NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    event_type TEXT NOT NULL,
    related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3 DEPOSIT ADDRESSES (TREASURY MANAGEMENT)
CREATE TABLE IF NOT EXISTS public.deposit_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset TEXT NOT NULL,
    network TEXT NOT NULL,
    address TEXT NOT NULL,
    memo_tag TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_asset_network_address UNIQUE (asset, network, address)
);

-- 2.4 DEPOSIT ADDRESS AUDIT HISTORY
CREATE TABLE IF NOT EXISTS public.deposit_address_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deposit_address_id UUID REFERENCES public.deposit_addresses(id) ON DELETE CASCADE,
    asset TEXT NOT NULL,
    network TEXT NOT NULL,
    previous_address TEXT,
    new_address TEXT NOT NULL,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.5 USER WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL DEFAULT 'USD',
    available_balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000 CHECK (available_balance >= 0),
    deposited_balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000 CHECK (deposited_balance >= 0),
    pending_rewards NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000 CHECK (pending_rewards >= 0),
    realized_rewards NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000 CHECK (realized_rewards >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_wallet_currency UNIQUE (user_id, currency)
);

-- 2.6 FINANCIAL TRANSACTIONS LEDGER
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'mining_yield', 'adjustment', 'fee')),
    asset TEXT NOT NULL,
    network TEXT NOT NULL,
    amount NUMERIC(28, 8) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'settled')),
    address TEXT,
    tx_hash TEXT,
    memo TEXT,
    admin_notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_deposit_addresses_asset_net ON public.deposit_addresses(asset, network);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);

-- 4. ENABLE ROW LEVEL SECURITY (RLS) ON NEW TABLES
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_address_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS POLICIES FOR NEW TABLES
DROP POLICY IF EXISTS "Admins can view all security logs" ON public.security_logs;
CREATE POLICY "Admins can view all security logs"
    ON public.security_logs FOR SELECT
    USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow insertion of security logs" ON public.security_logs;
CREATE POLICY "Allow insertion of security logs"
    ON public.security_logs FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can view notifications" ON public.admin_notifications;
CREATE POLICY "Only admins can view notifications"
    ON public.admin_notifications FOR SELECT
    USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Only admins can update notifications" ON public.admin_notifications;
CREATE POLICY "Only admins can update notifications"
    ON public.admin_notifications FOR UPDATE
    USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow insertion of admin notifications" ON public.admin_notifications;
CREATE POLICY "Allow insertion of admin notifications"
    ON public.admin_notifications FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view active deposit addresses or admin view all" ON public.deposit_addresses;
CREATE POLICY "Users can view active deposit addresses or admin view all"
    ON public.deposit_addresses FOR SELECT
    USING (is_active = true OR public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Only admins can modify deposit addresses" ON public.deposit_addresses;
CREATE POLICY "Only admins can modify deposit addresses"
    ON public.deposit_addresses FOR ALL
    USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Only admins can view deposit address history" ON public.deposit_address_history;
CREATE POLICY "Only admins can view deposit address history"
    ON public.deposit_address_history FOR SELECT
    USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Only admins can insert deposit address history" ON public.deposit_address_history;
CREATE POLICY "Only admins can insert deposit address history"
    ON public.deposit_address_history FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view own wallets or admin view all" ON public.wallets;
CREATE POLICY "Users can view own wallets or admin view all"
    ON public.wallets FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Only admins or service_role can modify wallets" ON public.wallets;
CREATE POLICY "Only admins or service_role can modify wallets"
    ON public.wallets FOR ALL
    USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view own transactions or admin view all" ON public.transactions;
CREATE POLICY "Users can view own transactions or admin view all"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Only admins or service_role can modify transactions" ON public.transactions;
CREATE POLICY "Only admins or service_role can modify transactions"
    ON public.transactions FOR ALL
    USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

-- 5. SEED INITIAL DEPOSIT ADDRESSES
INSERT INTO public.deposit_addresses (asset, network, address, memo_tag, is_active, notes)
VALUES
    ('BTC', 'BITCOIN', 'bc1q9x37uvk92m64789vqwzepj87vqk33t6a7zfl8m', NULL, true, 'Primary Institutional Cold Vault (Native SegWit)'),
    ('ETH', 'ERC20', '0x71C0D8B9364b63897d2B638148b172a5a06E7947', NULL, true, 'Multi-Sig Ethereum Treasury'),
    ('USDT', 'TRC20', 'TYDzsYUEpvnYmQk4zGP9sWWcTEd36AMW9y', NULL, true, 'High-Speed Zero Fee TRON Network Deposit'),
    ('USDT', 'ERC20', '0x71C0D8B9364b63897d2B638148b172a5a06E7947', NULL, true, 'Institutional ERC-20 Tether Gateway'),
    ('SOL', 'SOLANA', '7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyKWzqVvUhy9mPz', NULL, true, 'Solana Mainnet High-Throughput Node'),
    ('LTC', 'LITECOIN', 'ltc1qf8m9yvx8e4m8w2s5p3k9j7d2f4a6c8e0g1b3z5', NULL, true, 'Scrypt ASIC Mining Deposit Vault'),
    ('BNB', 'BEP20', '0x71C0D8B9364b63897d2B638148b172a5a06E7947', NULL, true, 'BNB Smart Chain Gateway')
ON CONFLICT (asset, network, address) DO UPDATE
SET is_active = EXCLUDED.is_active,
    updated_at = timezone('utc'::text, now());

-- 6. PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON public.deposit_addresses TO anon;
