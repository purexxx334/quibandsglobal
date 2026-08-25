-- ==============================================================================
-- MIGRATION: Fix Deposit Approval Balance Updates
-- DESCRIPTION: Ensures that approving a deposit updates wallets.deposit_balance,
--              profiles.deposit_balance, profiles.main_balance, and profiles.total_deposited.
-- ==============================================================================

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
    v_new_deposit_balance NUMERIC(28, 8);
    v_profile RECORD;
    v_prof_dep NUMERIC(28, 8);
    v_prof_mining NUMERIC(28, 8);
    v_prof_profit NUMERIC(28, 8);
    v_prof_main NUMERIC(28, 8);
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

    -- 3. Ensure user wallet exists for this asset and update balance + deposit_balance
    SELECT id, balance, deposit_balance INTO v_wallet_id, v_new_balance, v_new_deposit_balance
    FROM public.wallets
    WHERE user_id = v_deposit.user_id
    LIMIT 1;

    IF NOT FOUND THEN
        INSERT INTO public.wallets (user_id, currency, balance, deposit_balance, locked_balance, is_active)
        VALUES (v_deposit.user_id, v_deposit.asset, v_deposit.amount, v_deposit.amount, 0, TRUE)
        RETURNING id, balance INTO v_wallet_id, v_new_balance;
    ELSE
        UPDATE public.wallets
        SET balance = COALESCE(balance, 0) + v_deposit.amount,
            deposit_balance = COALESCE(deposit_balance, balance, 0) + v_deposit.amount,
            updated_at = NOW()
        WHERE id = v_wallet_id
        RETURNING balance INTO v_new_balance;
    END IF;

    -- 4. Update profile deposit_balance, main_balance, and total_deposited
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE auth_user_id = v_deposit.user_id OR id = v_deposit.user_id
    LIMIT 1;

    IF FOUND THEN
        v_prof_dep := COALESCE(v_profile.deposit_balance, v_profile.total_deposited, 0) + v_deposit.amount;
        v_prof_mining := COALESCE(v_profile.mining_balance, 0);
        v_prof_profit := COALESCE(v_profile.profit_balance, 0);
        v_prof_main := v_prof_dep + v_prof_mining + v_prof_profit;

        UPDATE public.profiles
        SET deposit_balance = v_prof_dep,
            main_balance = v_prof_main,
            total_deposited = COALESCE(total_deposited, 0) + v_deposit.amount,
            updated_at = NOW()
        WHERE id = v_profile.id;
    END IF;

    -- 5. Update the deposit request status to APPROVED
    UPDATE public.deposit_requests
    SET status = 'APPROVED',
        wallet_id = v_wallet_id,
        reviewed_by = p_admin_id,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_deposit_id;

    -- 6. Create immutable Ledger Transaction Entry
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

    -- 7. Record Audit Log
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

    -- 8. Disptach In-App User Notification
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
        'success', TRUE,
        'deposit_id', p_deposit_id,
        'user_id', v_deposit.user_id,
        'new_balance', v_new_balance,
        'status', 'APPROVED'
    );

    RETURN v_result;
END;
$$;
