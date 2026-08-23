-- ==============================================================================
-- QUIBANDS GLOBAL - ENTERPRISE CORE & SECURITY DATABASE SCHEMA
-- Database Engine: Supabase PostgreSQL
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLES DEFINITIONS
-- ==============================================================================

-- 2.1 PROFILES TABLE
-- Linked 1-to-1 with Supabase Auth users (auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    username TEXT UNIQUE,
    email TEXT NOT NULL,
    phone_number TEXT,
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending', 'flagged')),
    is_flagged BOOLEAN NOT NULL DEFAULT false,
    flag_reason TEXT,
    avatar_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 USER ROLES TABLE
-- Role-based access control decoupled from client claims
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- 2.3 SECURITY LOGS (LOGIN & TELEMETRY AUDIT)
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    event_type TEXT NOT NULL, -- 'login_success', 'login_failed', 'password_reset_request', 'password_reset_success', 'session_revoked', 'account_suspended', 'account_flagged'
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'warning')),
    ip_address TEXT,
    geo_location JSONB DEFAULT '{}'::jsonb, -- { "country": "US", "city": "Dallas", "region": "TX" }
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    operating_system TEXT, -- 'Windows 11', 'macOS', 'iOS', 'Android', 'Linux'
    browser TEXT, -- 'Chrome', 'Safari', 'Firefox', 'Edge'
    user_agent TEXT,
    session_id TEXT,
    auth_method TEXT DEFAULT 'email_password',
    risk_score INTEGER DEFAULT 0, -- 0 to 100
    risk_indicators JSONB DEFAULT '[]'::jsonb, -- ['new_device', 'foreign_ip', 'multiple_fails']
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.4 ADMIN NOTIFICATIONS TABLE
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

-- 2.5 DEPOSIT ADDRESSES TABLE (TREASURY MANAGEMENT)
CREATE TABLE IF NOT EXISTS public.deposit_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset TEXT NOT NULL, -- 'BTC', 'ETH', 'USDT', 'SOL', 'LTC', 'BNB'
    network TEXT NOT NULL, -- 'TRC20', 'ERC20', 'BEP20', 'BITCOIN', 'SOLANA', 'LITECOIN'
    address TEXT NOT NULL,
    memo_tag TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_asset_network_address UNIQUE (asset, network, address)
);

-- 2.6 DEPOSIT ADDRESS HISTORY (AUDIT LOGS FOR ADDRESS CHANGES)
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

-- 2.7 WALLETS TABLE (USER TREASURY ACCOUNTS)
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

-- 2.8 TRANSACTIONS TABLE (IMMUTABLE LEDGER)
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
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- for manual adjustments
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.9 GENERAL AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_flagged ON public.profiles(is_flagged);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON public.security_logs(ip_address);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deposit_addresses_asset_net ON public.deposit_addresses(asset, network);
CREATE INDEX IF NOT EXISTS idx_deposit_addresses_is_active ON public.deposit_addresses(is_active);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 4. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 4.1 Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_deposit_addresses_updated_at ON public.deposit_addresses;
CREATE TRIGGER tr_deposit_addresses_updated_at
    BEFORE UPDATE ON public.deposit_addresses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_wallets_updated_at ON public.wallets;
CREATE TRIGGER tr_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4.2 Helper function to check if the executing user has admin role
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

-- 4.3 Trigger function to automatically create profile, default role, and wallet on registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    extracted_full_name TEXT;
    extracted_username TEXT;
BEGIN
    extracted_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
    extracted_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4));

    -- 1. Insert Profile Record
    INSERT INTO public.profiles (
        auth_user_id,
        full_name,
        username,
        email,
        phone_number,
        account_status,
        metadata
    ) VALUES (
        NEW.id,
        extracted_full_name,
        extracted_username,
        NEW.email,
        NEW.phone,
        'active',
        jsonb_build_object('signup_provider', COALESCE(NEW.raw_app_meta_data->>'provider', 'email'))
    )
    ON CONFLICT (auth_user_id) DO UPDATE
    SET email = EXCLUDED.email,
        phone_number = EXCLUDED.phone_number,
        updated_at = timezone('utc'::text, now());

    -- 2. Insert Default 'user' Role
    INSERT INTO public.user_roles (
        user_id,
        role
    ) VALUES (
        NEW.id,
        'user'
    )
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 3. Initialize Primary Wallet for user
    INSERT INTO public.wallets (
        user_id,
        currency,
        available_balance,
        deposited_balance
    ) VALUES (
        NEW.id,
        'USD',
        0.00000000,
        0.00000000
    )
    ON CONFLICT (user_id, currency) DO NOTHING;

    -- 4. Log Registration in Audit Logs
    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        NEW.id,
        'USER_REGISTERED',
        'auth.users',
        NEW.id::text,
        jsonb_build_object('email', NEW.email, 'provider', NEW.raw_app_meta_data->>'provider')
    );

    -- 5. Trigger Admin Notification
    INSERT INTO public.admin_notifications (
        title,
        message,
        severity,
        event_type,
        related_user_id,
        metadata
    ) VALUES (
        'New User Registration',
        'New investor account registered: ' || NEW.email,
        'info',
        'USER_REGISTERED',
        NEW.id,
        jsonb_build_object('email', NEW.email, 'full_name', extracted_full_name)
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_address_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 PROFILES POLICIES
DROP POLICY IF EXISTS "Users can read own profile or admin can read all" ON public.profiles;
CREATE POLICY "Users can read own profile or admin can read all"
    ON public.profiles FOR SELECT
    USING (auth.uid() = auth_user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile or admin can update any" ON public.profiles;
CREATE POLICY "Users can update own profile or admin can update any"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = auth_user_id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = auth_user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Profiles insert allowed for service_role and triggers" ON public.profiles;
CREATE POLICY "Profiles insert allowed for service_role and triggers"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id OR public.is_admin(auth.uid()) OR auth.role() = 'service_role');

-- 5.2 USER ROLES POLICIES
DROP POLICY IF EXISTS "Users can view own roles or admin view all" ON public.user_roles;
CREATE POLICY "Users can view own roles or admin view all"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Only admins can modify roles" ON public.user_roles;
CREATE POLICY "Only admins can modify roles"
    ON public.user_roles FOR ALL
    USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

-- 5.3 SECURITY LOGS POLICIES
DROP POLICY IF EXISTS "Admins can view all security logs" ON public.security_logs;
CREATE POLICY "Admins can view all security logs"
    ON public.security_logs FOR SELECT
    USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow insertion of security logs" ON public.security_logs;
CREATE POLICY "Allow insertion of security logs"
    ON public.security_logs FOR INSERT
    WITH CHECK (true);

-- 5.4 ADMIN NOTIFICATIONS POLICIES
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

-- 5.5 DEPOSIT ADDRESSES POLICIES
-- Public & Authenticated users can view active deposit addresses; Admins can view/modify all
DROP POLICY IF EXISTS "Users can view active deposit addresses or admin view all" ON public.deposit_addresses;
CREATE POLICY "Users can view active deposit addresses or admin view all"
    ON public.deposit_addresses FOR SELECT
    USING (is_active = true OR public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Only admins can modify deposit addresses" ON public.deposit_addresses;
CREATE POLICY "Only admins can modify deposit addresses"
    ON public.deposit_addresses FOR ALL
    USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

-- 5.6 DEPOSIT ADDRESS HISTORY POLICIES
DROP POLICY IF EXISTS "Only admins can view deposit address history" ON public.deposit_address_history;
CREATE POLICY "Only admins can view deposit address history"
    ON public.deposit_address_history FOR SELECT
    USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Only admins can insert deposit address history" ON public.deposit_address_history;
CREATE POLICY "Only admins can insert deposit address history"
    ON public.deposit_address_history FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

-- 5.7 WALLETS POLICIES
DROP POLICY IF EXISTS "Users can view own wallets or admin view all" ON public.wallets;
CREATE POLICY "Users can view own wallets or admin view all"
    ON public.wallets FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Only admins or service_role can modify wallets" ON public.wallets;
CREATE POLICY "Only admins or service_role can modify wallets"
    ON public.wallets FOR ALL
    USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

-- 5.8 TRANSACTIONS POLICIES
DROP POLICY IF EXISTS "Users can view own transactions or admin view all" ON public.transactions;
CREATE POLICY "Users can view own transactions or admin view all"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Only admins or service_role can modify transactions" ON public.transactions;
CREATE POLICY "Only admins or service_role can modify transactions"
    ON public.transactions FOR ALL
    USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role')
    WITH CHECK (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

-- 5.9 AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin(auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow insertion of audit logs" ON public.audit_logs;
CREATE POLICY "Allow insertion of audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

-- ==============================================================================
-- 6. INITIAL SEED: DEFAULT DEPOSIT ADDRESSES
-- ==============================================================================

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

-- ==============================================================================
-- 7. EXPLICIT ROLE GRANTS (SUPABASE PERMISSIONS)
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.deposit_addresses TO anon;
