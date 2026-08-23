-- ==============================================================================
-- QUIBANDS GLOBAL - PHASE 3 INCREMENTAL MIGRATION: DEPOSIT REQUEST SYSTEM
-- ==============================================================================
-- Non-Destructive Incremental Migration Script
-- Safe to apply over existing databases.
-- Contains ZERO DROP TABLE, TRUNCATE, or DELETE statements.
-- ==============================================================================

-- 1. DEPOSIT REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.deposit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    asset VARCHAR(20) NOT NULL,
    network VARCHAR(50) NOT NULL,
    amount NUMERIC(28, 8) NOT NULL CHECK (amount > 0),
    deposit_address TEXT NOT NULL,
    memo_tag TEXT,
    transaction_hash TEXT NOT NULL,
    proof_reference TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_deposit_requests_user_id ON public.deposit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_status ON public.deposit_requests(status);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_asset ON public.deposit_requests(asset);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_created_at ON public.deposit_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_tx_hash ON public.deposit_requests(transaction_hash);

-- 2. USER NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'deposit_update',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);

-- 3. ATOMIC DEPOSIT APPROVAL FUNCTION
-- Ensures atomic row-locking, double-credit prevention, wallet balance update, and ledger entry creation
CREATE OR REPLACE FUNCTION public.approve_deposit_request(
    p_deposit_id UUID,
    p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deposit RECORD;
    v_wallet_id UUID;
    v_new_balance NUMERIC(28, 8);
    v_result JSONB;
BEGIN
    -- 1. Lock the deposit record to prevent concurrent approvals (Idempotency)
    SELECT * INTO v_deposit
    FROM public.deposit_requests
    WHERE id = p_deposit_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deposit request not found with ID: %', p_deposit_id;
    END IF;

    -- 2. Check if already processed
    IF v_deposit.status != 'PENDING' THEN
        RAISE EXCEPTION 'Deposit request cannot be approved. Current status is: %', v_deposit.status;
    END IF;

    -- 3. Ensure user wallet exists for this asset
    SELECT id INTO v_wallet_id
    FROM public.wallets
    WHERE user_id = v_deposit.user_id AND currency = v_deposit.asset;

    IF NOT FOUND THEN
        INSERT INTO public.wallets (user_id, currency, balance, locked_balance, is_active)
        VALUES (v_deposit.user_id, v_deposit.asset, v_deposit.amount, 0, TRUE)
        RETURNING id, balance INTO v_wallet_id, v_new_balance;
    ELSE
        UPDATE public.wallets
        SET balance = balance + v_deposit.amount,
            updated_at = NOW()
        WHERE id = v_wallet_id
        RETURNING balance INTO v_new_balance;
    END IF;

    -- 4. Update the deposit request status to APPROVED
    UPDATE public.deposit_requests
    SET status = 'APPROVED',
        wallet_id = v_wallet_id,
        reviewed_by = p_admin_id,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_deposit_id;

    -- 5. Create immutable Ledger Transaction Entry
    INSERT INTO public.transactions (
        wallet_id,
        user_id,
        type,
        amount,
        currency,
        status,
        reference,
        description,
        metadata
    ) VALUES (
        v_wallet_id,
        v_deposit.user_id,
        'DEPOSIT',
        v_deposit.amount,
        v_deposit.asset,
        'COMPLETED',
        v_deposit.transaction_hash,
        'Deposit approved by Admin ' || COALESCE(p_admin_id::text, 'system'),
        jsonb_build_object(
            'deposit_request_id', p_deposit_id,
            'network', v_deposit.network,
            'deposit_address', v_deposit.deposit_address,
            'approved_by', p_admin_id
        )
    );

    -- 6. Record Audit Log
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        target_id,
        details
    ) VALUES (
        p_admin_id,
        'DEPOSIT_APPROVED',
        p_deposit_id,
        jsonb_build_object(
            'amount', v_deposit.amount,
            'asset', v_deposit.asset,
            'network', v_deposit.network,
            'user_id', v_deposit.user_id,
            'new_balance', v_new_balance,
            'transaction_hash', v_deposit.transaction_hash
        )
    );

    -- 7. Dispatch In-App Notification to User
    INSERT INTO public.user_notifications (
        user_id,
        title,
        message,
        type,
        data
    ) VALUES (
        v_deposit.user_id,
        'Deposit Approved',
        'Your deposit of ' || v_deposit.amount::text || ' ' || v_deposit.asset || ' (' || v_deposit.network || ') has been approved and credited to your wallet.',
        'deposit_approved',
        jsonb_build_object(
            'deposit_id', p_deposit_id,
            'amount', v_deposit.amount,
            'asset', v_deposit.asset,
            'tx_hash', v_deposit.transaction_hash
        )
    );

    v_result := jsonb_build_object(
        'success', true,
        'deposit_id', p_deposit_id,
        'status', 'APPROVED',
        'wallet_id', v_wallet_id,
        'amount', v_deposit.amount,
        'asset', v_deposit.asset,
        'new_balance', v_new_balance
    );

    RETURN v_result;
END;
$$;

-- 4. ATOMIC DEPOSIT REJECTION FUNCTION
CREATE OR REPLACE FUNCTION public.reject_deposit_request(
    p_deposit_id UUID,
    p_admin_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deposit RECORD;
    v_result JSONB;
BEGIN
    -- 1. Lock the deposit record
    SELECT * INTO v_deposit
    FROM public.deposit_requests
    WHERE id = p_deposit_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deposit request not found with ID: %', p_deposit_id;
    END IF;

    -- 2. Validate current status
    IF v_deposit.status != 'PENDING' THEN
        RAISE EXCEPTION 'Deposit request cannot be rejected. Current status is: %', v_deposit.status;
    END IF;

    IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
        RAISE EXCEPTION 'A valid rejection reason is required.';
    END IF;

    -- 3. Update deposit status to REJECTED (Wallet is NOT credited)
    UPDATE public.deposit_requests
    SET status = 'REJECTED',
        rejection_reason = p_reason,
        reviewed_by = p_admin_id,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_deposit_id;

    -- 4. Record Audit Log
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        target_id,
        details
    ) VALUES (
        p_admin_id,
        'DEPOSIT_REJECTED',
        p_deposit_id,
        jsonb_build_object(
            'amount', v_deposit.amount,
            'asset', v_deposit.asset,
            'user_id', v_deposit.user_id,
            'reason', p_reason
        )
    );

    -- 5. Dispatch In-App Notification to User
    INSERT INTO public.user_notifications (
        user_id,
        title,
        message,
        type,
        data
    ) VALUES (
        v_deposit.user_id,
        'Deposit Rejected',
        'Your deposit of ' || v_deposit.amount::text || ' ' || v_deposit.asset || ' was rejected. Reason: ' || p_reason,
        'deposit_rejected',
        jsonb_build_object(
            'deposit_id', p_deposit_id,
            'reason', p_reason,
            'amount', v_deposit.amount,
            'asset', v_deposit.asset
        )
    );

    v_result := jsonb_build_object(
        'success', true,
        'deposit_id', p_deposit_id,
        'status', 'REJECTED',
        'rejection_reason', p_reason
    );

    RETURN v_result;
END;
$$;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can insert their own deposit requests with initial PENDING status
CREATE POLICY "Users can create deposit requests"
    ON public.deposit_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id AND status = 'PENDING');

-- Users can view only their own deposit requests
CREATE POLICY "Users can view own deposit requests"
    ON public.deposit_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Admins / Service Role have full access to deposit requests
CREATE POLICY "Service Role and Admins full access deposit_requests"
    ON public.deposit_requests
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON public.user_notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
    ON public.user_notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service Role full access user_notifications"
    ON public.user_notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. GRANTS
GRANT ALL ON TABLE public.deposit_requests TO authenticated, service_role;
GRANT ALL ON TABLE public.user_notifications TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_deposit_request TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_deposit_request TO authenticated, service_role;
