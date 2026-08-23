-- =========================================================================
-- QUIBANDS GLOBAL - 24/7 INTERACTIVE LIVE SUPPORT CHAT & MESSAGE BOT SYSTEM
-- =========================================================================

-- 1. SUPPORT CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.support_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'PENDING_ADMIN', 'RESOLVED', 'CLOSED'
    subject VARCHAR(255) DEFAULT 'General Inquiries & Account Support',
    last_message TEXT,
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_sender_type VARCHAR(16) DEFAULT 'USER', -- 'USER', 'ADMIN', 'BOT'
    unread_user_count INT NOT NULL DEFAULT 0,
    unread_admin_count INT NOT NULL DEFAULT 0,
    is_bot_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_conversation UNIQUE (user_id)
);

-- 2. SUPPORT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(16) NOT NULL, -- 'USER', 'ADMIN', 'BOT'
    sender_id UUID, -- NULL for BOT, auth_user_id for USER / ADMIN
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES FOR HIGH-SPEED LIVE POLLING
CREATE INDEX IF NOT EXISTS idx_support_conv_user ON public.support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conv_status ON public.support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_support_conv_last_msg ON public.support_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_msg_conv ON public.support_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_support_msg_unread ON public.support_messages(conversation_id, is_read);

-- 4. ROW LEVEL SECURITY
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- User Policies for Conversations
DROP POLICY IF EXISTS "Users can view own conversation" ON public.support_conversations;
CREATE POLICY "Users can view own conversation" ON public.support_conversations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own conversation" ON public.support_conversations;
CREATE POLICY "Users can create own conversation" ON public.support_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversation" ON public.support_conversations;
CREATE POLICY "Users can update own conversation" ON public.support_conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- User Policies for Messages
DROP POLICY IF EXISTS "Users can view messages in own conversation" ON public.support_messages;
CREATE POLICY "Users can view messages in own conversation" ON public.support_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_conversations sc
            WHERE sc.id = support_messages.conversation_id AND sc.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert messages in own conversation" ON public.support_messages;
CREATE POLICY "Users can insert messages in own conversation" ON public.support_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_conversations sc
            WHERE sc.id = support_messages.conversation_id AND sc.user_id = auth.uid()
        )
    );

-- Service Role Full Access (Bypasses RLS for Admin APIs)
DROP POLICY IF EXISTS "Service role full access on conversations" ON public.support_conversations;
CREATE POLICY "Service role full access on conversations" ON public.support_conversations
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on messages" ON public.support_messages;
CREATE POLICY "Service role full access on messages" ON public.support_messages
    FOR ALL USING (true) WITH CHECK (true);
