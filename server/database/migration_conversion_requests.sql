-- Migration: Conversion Requests & Convert Balance
-- Enables USD Mine -> Local Currency Mine Conversion with 20% BNB Conversion Fee, Admin Approval Workflow, and Convert Balance Tracking

CREATE TABLE IF NOT EXISTS conversion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    usd_mine_amount NUMERIC(16, 2) NOT NULL,
    target_currency TEXT NOT NULL DEFAULT 'SGD',
    converted_amount NUMERIC(16, 2) NOT NULL,
    exchange_rate NUMERIC(12, 4) NOT NULL DEFAULT 1.35,
    conversion_fee_usd NUMERIC(16, 2) NOT NULL,
    conversion_fee_bnb NUMERIC(16, 6) NOT NULL,
    fee_wallet_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONVERTED', 'REJECTED')),
    ref_code TEXT NOT NULL UNIQUE,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add convert_balance and convert_currency to profiles if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'convert_balance'
    ) THEN
        ALTER TABLE profiles ADD COLUMN convert_balance NUMERIC(16, 2) DEFAULT 0.00;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'convert_currency'
    ) THEN
        ALTER TABLE profiles ADD COLUMN convert_currency TEXT DEFAULT 'SGD';
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE conversion_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversion requests
CREATE POLICY "Users can view own conversion requests" 
ON conversion_requests FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own conversion requests
CREATE POLICY "Users can insert own conversion requests" 
ON conversion_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Service role / admins can manage all conversion requests
CREATE POLICY "Admins can manage all conversion requests" 
ON conversion_requests FOR ALL 
USING (true)
WITH CHECK (true);
