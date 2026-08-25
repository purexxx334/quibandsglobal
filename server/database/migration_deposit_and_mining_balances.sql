-- ==============================================================================
-- QUIBANDS GLOBAL - EXTEND DEPOSIT BALANCE, MINING BALANCE & MAIN BALANCE
-- ==============================================================================
-- Safe, idempotent SQL script for Supabase SQL Editor
-- ==============================================================================

-- 1. Extend profiles table with deposit_balance and deposit_remark
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deposit_balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000,
  ADD COLUMN IF NOT EXISTS main_balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000,
  ADD COLUMN IF NOT EXISTS mining_balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000,
  ADD COLUMN IF NOT EXISTS profit_balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000,
  ADD COLUMN IF NOT EXISTS deposit_remark TEXT,
  ADD COLUMN IF NOT EXISTS balance_remark TEXT,
  ADD COLUMN IF NOT EXISTS mining_remark TEXT,
  ADD COLUMN IF NOT EXISTS profit_remark TEXT;

-- 2. Extend wallets table
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS deposit_balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000,
  ADD COLUMN IF NOT EXISTS mining_balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000,
  ADD COLUMN IF NOT EXISTS profit_balance NUMERIC(28, 8) NOT NULL DEFAULT 0.00000000;
