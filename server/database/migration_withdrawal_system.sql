-- ==============================================================================
-- QUIBANDS GLOBAL - PHASE 4 INCREMENTAL MIGRATION: WITHDRAWAL SYSTEM
-- ==============================================================================
-- Non-Destructive Incremental Migration Script
-- Safe to apply over existing Supabase databases.
-- Contains ZERO DROP TABLE, TRUNCATE, or DELETE statements.
-- ==============================================================================

-- 1. ENSURE WALLETS TABLE & REQUIRED COLUMNS EXIST
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency VARCHAR(20) NOT NULL DEFAULT 'USDT',
    balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000 CHECK (balance >= 0),
    locked_balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000 CHECK (locked_balance >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_currency UNIQUE (user_id, currency)
);

-- Safely add columns if wallets table existed previously with older schema
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS locked_balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. ENSURE FINANCIAL LEDGERS TABLE EXISTS
CREATE TABLE IF NOT EXISTS public.financial_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'DEPOSIT', 'WITHDRAWAL', 'WITHDRAWAL_FEE', 'ADJUSTMENT'
    amount NUMERIC(28, 8) NOT NULL,
    currency VARCHAR(20) NOT NULL,
    reference_id UUID,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ENSURE AUDIT LOGS TABLE EXISTS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ENSURE USER NOTIFICATIONS TABLE EXISTS
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. WITHDRAWAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    asset VARCHAR(20) NOT NULL,
    network VARCHAR(50) NOT NULL,
    destination_wallet_address TEXT NOT NULL,
    amount NUMERIC(28, 8) NOT NULL CHECK (amount > 0),
    fee_amount NUMERIC(28, 8) NOT NULL DEFAULT 0.0 CHECK (fee_amount >= 0),
    net_amount NUMERIC(28, 8) NOT NULL CHECK (net_amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'FAILED')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_asset ON public.withdrawal_requests(asset);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON public.withdrawal_requests(created_at DESC);

-- 6. WITHDRAWAL FEE / GAS RECORDS TABLE (Requirement 9: Separate Gas/Fee Workflow)
CREATE TABLE IF NOT EXISTS public.withdrawal_fee_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    withdrawal_id UUID REFERENCES public.withdrawal_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset VARCHAR(20) NOT NULL,
    fee_type VARCHAR(50) NOT NULL DEFAULT 'PLATFORM_WITHDRAWAL_FEE',
    fee_amount NUMERIC(28, 8) NOT NULL CHECK (fee_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawal_fee_records_withdrawal_id ON public.withdrawal_fee_records(withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_fee_records_status ON public.withdrawal_fee_records(status);

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_fee_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    -- Wallets RLS
    DROP POLICY IF EXISTS "Users can view own wallets or admin view all" ON public.wallets;
    DROP POLICY IF EXISTS "Only admins or service_role can modify wallets" ON public.wallets;
    DROP POLICY IF EXISTS "Users can view own wallets" ON public.wallets;
    DROP POLICY IF EXISTS "Service Role full access wallets" ON public.wallets;

    CREATE POLICY "Users can view own wallets"
        ON public.wallets FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);

    CREATE POLICY "Service Role full access wallets"
        ON public.wallets FOR ALL
        TO service_role
        USING (true) WITH CHECK (true);

    -- Withdrawal Requests RLS
    DROP POLICY IF EXISTS "Users can view own withdrawal requests or admin view all" ON public.withdrawal_requests;
    DROP POLICY IF EXISTS "Only admins or service_role can modify withdrawal requests" ON public.withdrawal_requests;
    DROP POLICY IF EXISTS "Users can create withdrawal requests" ON public.withdrawal_requests;
    DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
    DROP POLICY IF EXISTS "Service Role full access withdrawal_requests" ON public.withdrawal_requests;

    CREATE POLICY "Users can create withdrawal requests"
        ON public.withdrawal_requests FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id AND status = 'PENDING');

    CREATE POLICY "Users can view own withdrawal requests"
        ON public.withdrawal_requests FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);

    CREATE POLICY "Service Role full access withdrawal_requests"
        ON public.withdrawal_requests FOR ALL
        TO service_role
        USING (true) WITH CHECK (true);

    -- Withdrawal Fee Records RLS
    DROP POLICY IF EXISTS "Users can view own fee records or admin view all" ON public.withdrawal_fee_records;
    DROP POLICY IF EXISTS "Only admins or service_role can modify fee records" ON public.withdrawal_fee_records;
    DROP POLICY IF EXISTS "Users can view own fee records" ON public.withdrawal_fee_records;
    DROP POLICY IF EXISTS "Service Role full access withdrawal_fee_records" ON public.withdrawal_fee_records;

    CREATE POLICY "Users can view own fee records"
        ON public.withdrawal_fee_records FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);

    CREATE POLICY "Service Role full access withdrawal_fee_records"
        ON public.withdrawal_fee_records FOR ALL
        TO service_role
        USING (true) WITH CHECK (true);

    -- Financial Ledgers RLS
    DROP POLICY IF EXISTS "Users can view own ledgers or admin view all" ON public.financial_ledgers;
    DROP POLICY IF EXISTS "Users can view own ledgers" ON public.financial_ledgers;
    DROP POLICY IF EXISTS "Service Role full access financial_ledgers" ON public.financial_ledgers;

    CREATE POLICY "Users can view own ledgers"
        ON public.financial_ledgers FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);

    CREATE POLICY "Service Role full access financial_ledgers"
        ON public.financial_ledgers FOR ALL
        TO service_role
        USING (true) WITH CHECK (true);

    -- User Notifications RLS
    DROP POLICY IF EXISTS "Users can view own notifications" ON public.user_notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON public.user_notifications;
    DROP POLICY IF EXISTS "Service Role full access user_notifications" ON public.user_notifications;

    CREATE POLICY "Users can view own notifications"
        ON public.user_notifications FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can update own notifications"
        ON public.user_notifications FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Service Role full access user_notifications"
        ON public.user_notifications FOR ALL
        TO service_role
        USING (true) WITH CHECK (true);
END $$;

-- 8. ATOMIC STORED PROCEDURES

-- 8.1 CREATE WITHDRAWAL REQUEST WITH ATOMIC FUND LOCKING & 20% FEE
CREATE OR REPLACE FUNCTION public.create_withdrawal_request(
    p_user_id UUID,
    p_asset VARCHAR,
    p_network VARCHAR,
    p_destination_address TEXT,
    p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wallet RECORD;
    v_fee NUMERIC(28, 8);
    v_net NUMERIC(28, 8);
    v_withdrawal_id UUID;
    v_fee_record_id UUID;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Withdrawal amount must be greater than zero.';
    END IF;

    IF p_destination_address IS NULL OR TRIM(p_destination_address) = '' THEN
        RAISE EXCEPTION 'Destination wallet address is required.';
    END IF;

    v_fee := ROUND((p_amount * 0.20)::numeric, 8);
    v_net := ROUND((p_amount - v_fee)::numeric, 8);

    IF v_net <= 0 THEN
        RAISE EXCEPTION 'Calculated net amount after 20%% platform fee must be positive.';
    END IF;

    SELECT * INTO v_wallet
    FROM public.wallets
    WHERE user_id = p_user_id AND UPPER(currency) = UPPER(p_asset)
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.wallets (
            user_id,
            currency,
            balance,
            locked_balance,
            is_active
        ) VALUES (
            p_user_id,
            UPPER(p_asset),
            0.00000000,
            0.00000000,
            true
        ) RETURNING * INTO v_wallet;
    END IF;

    IF NOT v_wallet.is_active THEN
        RAISE EXCEPTION 'Wallet for asset % is disabled or frozen.', p_asset;
    END IF;

    IF (COALESCE(v_wallet.balance, 0) - COALESCE(v_wallet.locked_balance, 0)) < p_amount THEN
        RAISE EXCEPTION 'Insufficient available balance. Required: % %, Available: % %. Please deposit funds first.',
            p_amount, UPPER(p_asset), (COALESCE(v_wallet.balance, 0) - COALESCE(v_wallet.locked_balance, 0)), UPPER(p_asset);
    END IF;

    UPDATE public.wallets
    SET locked_balance = COALESCE(locked_balance, 0) + p_amount,
        updated_at = NOW()
    WHERE id = v_wallet.id;

    INSERT INTO public.withdrawal_requests (
        user_id,
        wallet_id,
        asset,
        network,
        destination_wallet_address,
        amount,
        fee_amount,
        net_amount,
        status
    ) VALUES (
        p_user_id,
        v_wallet.id,
        UPPER(p_asset),
        UPPER(p_network),
        TRIM(p_destination_address),
        p_amount,
        v_fee,
        v_net,
        'PENDING'
    ) RETURNING id INTO v_withdrawal_id;

    INSERT INTO public.withdrawal_fee_records (
        withdrawal_id,
        user_id,
        asset,
        fee_type,
        fee_amount,
        status,
        notes
    ) VALUES (
        v_withdrawal_id,
        p_user_id,
        UPPER(p_asset),
        'PLATFORM_WITHDRAWAL_FEE',
        v_fee,
        'PENDING',
        '20% Platform Withdrawal Fee'
    ) RETURNING id INTO v_fee_record_id;

    INSERT INTO public.audit_logs (
        actor_id,
        action,
        target_id,
        details
    ) VALUES (
        p_user_id,
        'WITHDRAWAL_REQUESTED',
        v_withdrawal_id,
        jsonb_build_object(
            'asset', UPPER(p_asset),
            'network', UPPER(p_network),
            'amount', p_amount,
            'fee_amount', v_fee,
            'net_amount', v_net,
            'destination_address', TRIM(p_destination_address),
            'locked_balance_added', p_amount
        )
    );

    INSERT INTO public.user_notifications (
        user_id,
        title,
        message,
        type,
        data
    ) VALUES (
        p_user_id,
        'Withdrawal Requested',
        'Your withdrawal request of ' || p_amount || ' ' || UPPER(p_asset) || ' (Net: ' || v_net || ', Fee: ' || v_fee || ') is pending review.',
        'withdrawal_pending',
        jsonb_build_object(
            'withdrawal_id', v_withdrawal_id,
            'amount', p_amount,
            'fee', v_fee,
            'net', v_net,
            'asset', UPPER(p_asset)
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'withdrawal_id', v_withdrawal_id,
        'fee_record_id', v_fee_record_id,
        'gross_amount', p_amount,
        'fee_amount', v_fee,
        'net_amount', v_net,
        'status', 'PENDING'
    );
END;
$$;

-- 8.2 APPROVE WITHDRAWAL REQUEST (ATOMIC BALANCE DEBIT & LEDGER SETTLEMENT)
CREATE OR REPLACE FUNCTION public.approve_withdrawal_request(
    p_withdrawal_id UUID,
    p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_withdrawal RECORD;
    v_wallet RECORD;
BEGIN
    SELECT * INTO v_withdrawal
    FROM public.withdrawal_requests
    WHERE id = p_withdrawal_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal request not found with ID %', p_withdrawal_id;
    END IF;

    IF v_withdrawal.status <> 'PENDING' THEN
        RAISE EXCEPTION 'Withdrawal request % cannot be approved. Current status is %', p_withdrawal_id, v_withdrawal.status;
    END IF;

    SELECT * INTO v_wallet
    FROM public.wallets
    WHERE id = v_withdrawal.wallet_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet record not found for withdrawal %', p_withdrawal_id;
    END IF;

    UPDATE public.wallets
    SET balance = balance - v_withdrawal.amount,
        locked_balance = GREATEST(0, COALESCE(locked_balance, 0) - v_withdrawal.amount),
        updated_at = NOW()
    WHERE id = v_wallet.id;

    UPDATE public.withdrawal_requests
    SET status = 'APPROVED',
        reviewed_by = p_admin_id,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_withdrawal_id;

    INSERT INTO public.financial_ledgers (
        user_id,
        wallet_id,
        transaction_type,
        amount,
        currency,
        reference_id,
        description,
        metadata
    ) VALUES (
        v_withdrawal.user_id,
        v_wallet.id,
        'WITHDRAWAL',
        -v_withdrawal.net_amount,
        v_withdrawal.asset,
        v_withdrawal.id,
        'Approved Withdrawal Payout to ' || v_withdrawal.destination_wallet_address,
        jsonb_build_object(
            'withdrawal_id', p_withdrawal_id,
            'destination_address', v_withdrawal.destination_wallet_address,
            'network', v_withdrawal.network,
            'approved_by', p_admin_id
        )
    ), (
        v_withdrawal.user_id,
        v_wallet.id,
        'WITHDRAWAL_FEE',
        -v_withdrawal.fee_amount,
        v_withdrawal.asset,
        v_withdrawal.id,
        '20% Platform Withdrawal Fee Deduction',
        jsonb_build_object(
            'withdrawal_id', p_withdrawal_id,
            'gross_amount', v_withdrawal.amount,
            'fee_rate', '20%'
        )
    );

    INSERT INTO public.audit_logs (
        actor_id,
        action,
        target_id,
        details
    ) VALUES (
        p_admin_id,
        'WITHDRAWAL_APPROVED',
        p_withdrawal_id,
        jsonb_build_object(
            'withdrawal_id', p_withdrawal_id,
            'user_id', v_withdrawal.user_id,
            'gross_amount', v_withdrawal.amount,
            'fee_amount', v_withdrawal.fee_amount,
            'net_amount', v_withdrawal.net_amount,
            'asset', v_withdrawal.asset
        )
    );

    INSERT INTO public.user_notifications (
        user_id,
        title,
        message,
        type,
        data
    ) VALUES (
        v_withdrawal.user_id,
        'Withdrawal Approved',
        'Your withdrawal of ' || v_withdrawal.net_amount || ' ' || v_withdrawal.asset || ' has been approved by admin and settled.',
        'withdrawal_approved',
        jsonb_build_object(
            'withdrawal_id', p_withdrawal_id,
            'amount', v_withdrawal.net_amount,
            'asset', v_withdrawal.asset,
            'destination_address', v_withdrawal.destination_wallet_address
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'withdrawal_id', p_withdrawal_id,
        'status', 'APPROVED'
    );
END;
$$;

-- 8.3 REJECT WITHDRAWAL REQUEST (UNLOCK RESERVED FUNDS)
CREATE OR REPLACE FUNCTION public.reject_withdrawal_request(
    p_withdrawal_id UUID,
    p_admin_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_withdrawal RECORD;
    v_wallet RECORD;
BEGIN
    IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
        RAISE EXCEPTION 'A valid rejection reason is required.';
    END IF;

    SELECT * INTO v_withdrawal
    FROM public.withdrawal_requests
    WHERE id = p_withdrawal_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal request not found with ID %', p_withdrawal_id;
    END IF;

    IF v_withdrawal.status <> 'PENDING' THEN
        RAISE EXCEPTION 'Withdrawal request % cannot be rejected. Current status is %', p_withdrawal_id, v_withdrawal.status;
    END IF;

    SELECT * INTO v_wallet
    FROM public.wallets
    WHERE id = v_withdrawal.wallet_id
    FOR UPDATE;

    IF FOUND THEN
        UPDATE public.wallets
        SET locked_balance = GREATEST(0, COALESCE(locked_balance, 0) - v_withdrawal.amount),
            updated_at = NOW()
        WHERE id = v_wallet.id;
    END IF;

    UPDATE public.withdrawal_requests
    SET status = 'REJECTED',
        rejection_reason = TRIM(p_reason),
        reviewed_by = p_admin_id,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_withdrawal_id;

    INSERT INTO public.audit_logs (
        actor_id,
        action,
        target_id,
        details
    ) VALUES (
        p_admin_id,
        'WITHDRAWAL_REJECTED',
        p_withdrawal_id,
        jsonb_build_object(
            'withdrawal_id', p_withdrawal_id,
            'user_id', v_withdrawal.user_id,
            'reason', TRIM(p_reason),
            'amount_unlocked', v_withdrawal.amount,
            'asset', v_withdrawal.asset
        )
    );

    INSERT INTO public.user_notifications (
        user_id,
        title,
        message,
        type,
        data
    ) VALUES (
        v_withdrawal.user_id,
        'Withdrawal Rejected',
        'Your withdrawal request of ' || v_withdrawal.amount || ' ' || v_withdrawal.asset || ' was rejected. Reason: ' || TRIM(p_reason) || '. Reserved funds have been restored to your available balance.',
        'withdrawal_rejected',
        jsonb_build_object(
            'withdrawal_id', p_withdrawal_id,
            'amount', v_withdrawal.amount,
            'asset', v_withdrawal.asset,
            'reason', TRIM(p_reason)
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'withdrawal_id', p_withdrawal_id,
        'status', 'REJECTED'
    );
END;
$$;

-- 8.4 REVIEW WITHDRAWAL FEE RECORD (Requirement 9)
CREATE OR REPLACE FUNCTION public.review_withdrawal_fee_record(
    p_fee_id UUID,
    p_admin_id UUID,
    p_status VARCHAR,
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.withdrawal_fee_records
    SET status = p_status,
        reviewed_by = p_admin_id,
        reviewed_at = NOW(),
        notes = p_notes,
        updated_at = NOW()
    WHERE id = p_fee_id;

    RETURN jsonb_build_object('success', true, 'status', p_status);
END;
$$;
