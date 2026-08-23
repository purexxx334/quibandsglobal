import { supabaseAdmin } from '../config/supabase';
import { SupportConversation, SupportMessage } from '../types';

export class SupportService {
  /**
   * Get or create a support conversation for a user
   */
  async getOrCreateUserConversation(userId: string, userEmail: string, userName?: string): Promise<SupportConversation> {
    // 1. Check if conversation already exists
    const { data: existing, error } = await supabaseAdmin
      .from('support_conversations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    // 2. Create new conversation with an initial welcome message from the VIP AI Support Bot
    const { data: newConv, error: createErr } = await supabaseAdmin
      .from('support_conversations')
      .insert({
        user_id: userId,
        user_email: userEmail,
        user_name: userName || userEmail.split('@')[0],
        status: 'OPEN',
        last_message: 'Welcome to Quibands Global 24/7 VIP Support Desk.',
        last_message_at: new Date().toISOString(),
        last_sender_type: 'BOT',
        unread_user_count: 1,
        unread_admin_count: 0,
        is_bot_active: true,
      })
      .select()
      .single();

    if (createErr || !newConv) {
      throw new Error(createErr?.message || 'Failed to initialize support conversation.');
    }

    // Insert Initial Bot Welcome Message
    await supabaseAdmin.from('support_messages').insert({
      conversation_id: newConv.id,
      sender_type: 'BOT',
      sender_name: 'Quibands VIP Assistant',
      message: `Hello ${userName || 'Trader'}! 👋 Welcome to Quibands Global Institutional Support. How can our team assist you today?\n\nQuick options:\n• Deposit & Receiving Addresses\n• Cloud Mining & Hashrate\n• Withdrawals & Payouts\n• KYC Identity Verification\n• Account Tier Upgrade\n• Speak to a Live Agent`,
      is_read: false,
    });

    return newConv;
  }


  /**
   * Get all messages in a conversation
   */
  async getConversationMessages(conversationId: string): Promise<SupportMessage[]> {
    const { data, error } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  }

  /**
   * Send a user message and trigger automated Bot response if active
   */
  async sendUserMessage(userId: string, userEmail: string, userName: string, message: string): Promise<{ userMessage: SupportMessage; botMessage?: SupportMessage }> {
    const conv = await this.getOrCreateUserConversation(userId, userEmail, userName);

    // 1. Insert User Message
    const { data: userMsg, error: msgErr } = await supabaseAdmin
      .from('support_messages')
      .insert({
        conversation_id: conv.id,
        sender_type: 'USER',
        sender_id: userId,
        sender_name: userName || userEmail.split('@')[0],
        message: message.trim(),
        is_read: false,
      })
      .select()
      .single();

    if (msgErr || !userMsg) {
      throw new Error(msgErr?.message || 'Failed to send message.');
    }

    // 2. Update Conversation state
    await supabaseAdmin
      .from('support_conversations')
      .update({
        last_message: message.trim(),
        last_message_at: new Date().toISOString(),
        last_sender_type: 'USER',
        status: 'PENDING_ADMIN',
        unread_admin_count: (conv.unread_admin_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conv.id);

    // 3. Automated Message Bot Response (if Bot is active)
    let botMsg: SupportMessage | undefined;
    if (conv.is_bot_active) {
      const replyText = this.generateBotResponse(message.trim(), userName);
      
      const { data: botCreated } = await supabaseAdmin
        .from('support_messages')
        .insert({
          conversation_id: conv.id,
          sender_type: 'BOT',
          sender_name: 'Quibands VIP Assistant',
          message: replyText,
          is_read: false,
        })
        .select()
        .single();

      if (botCreated) {
        botMsg = botCreated;
        await supabaseAdmin
          .from('support_conversations')
          .update({
            last_message: replyText,
            last_message_at: new Date().toISOString(),
            last_sender_type: 'BOT',
            unread_user_count: (conv.unread_user_count || 0) + 1,
          })
          .eq('id', conv.id);
      }
    }

    return { userMessage: userMsg, botMessage: botMsg };
  }

  /**
   * Admin replies to a user conversation
   */
  async sendAdminMessage(adminId: string, adminName: string, conversationId: string, message: string): Promise<SupportMessage> {
    const { data: adminMsg, error: msgErr } = await supabaseAdmin
      .from('support_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'ADMIN',
        sender_id: adminId,
        sender_name: adminName || 'Support Compliance Officer',
        message: message.trim(),
        is_read: false,
      })
      .select()
      .single();

    if (msgErr || !adminMsg) {
      throw new Error(msgErr?.message || 'Failed to dispatch admin response.');
    }

    // Update conversation: set last message, mark unread for user, status = OPEN
    await supabaseAdmin
      .from('support_conversations')
      .update({
        last_message: message.trim(),
        last_message_at: new Date().toISOString(),
        last_sender_type: 'ADMIN',
        status: 'OPEN',
        unread_user_count: 1, // trigger notification badge for user
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    return adminMsg;
  }

  /**
   * Mark all unread messages in conversation as read
   */
  async markMessagesRead(conversationId: string, role: 'USER' | 'ADMIN'): Promise<void> {
    if (role === 'USER') {
      await supabaseAdmin
        .from('support_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .in('sender_type', ['ADMIN', 'BOT']);

      await supabaseAdmin
        .from('support_conversations')
        .update({ unread_user_count: 0 })
        .eq('id', conversationId);
    } else {
      await supabaseAdmin
        .from('support_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'USER');

      await supabaseAdmin
        .from('support_conversations')
        .update({ unread_admin_count: 0 })
        .eq('id', conversationId);
    }
  }

  /**
   * Admin: List all user support conversations with user profiles
   */
  async getAllConversations(): Promise<SupportConversation[]> {
    const { data: convs, error } = await supabaseAdmin
      .from('support_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Attach user profile information
    const userIds = (convs || []).map((c) => c.user_id);
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('auth_user_id', userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.auth_user_id, p]));
      return (convs || []).map((c) => ({
        ...c,
        user_profile: profileMap.get(c.user_id),
      }));
    }

    return convs || [];
  }

  /**
   * Admin: Update conversation status or toggle bot
   */
  async updateConversationStatus(conversationId: string, status?: string, isBotActive?: boolean): Promise<SupportConversation> {
    const updates: any = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (typeof isBotActive === 'boolean') updates.is_bot_active = isBotActive;

    const { data, error } = await supabaseAdmin
      .from('support_conversations')
      .update(updates)
      .eq('id', conversationId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update conversation.');
    }
    return data;
  }

  /**
   * Intelligent Rule-Based AI Message Bot Engine
   */
  private generateBotResponse(text: string, userName?: string): string {
    const query = text.toLowerCase();

    if (query.includes('gas fee') || query.includes('fee') || query.includes('20%')) {
      return `Regarding Gas Fees: To authorize institutional withdrawals, an external gas fee is paid directly to the network treasury vault. Gas fees are not deducted from your balance—100% of your requested funds are credited once clearance is verified by compliance.`;
    }

    if (query.includes('withdraw') || query.includes('payout') || query.includes('cash out')) {
      return `Institutional Withdrawals are processed 24/7 across Bank Wires and Crypto Networks (TRC20, ERC20, BTC). Once your request and gas fee are submitted, the status will show PENDING until final blockchain clearance.`;
    }

    if (query.includes('deposit') || query.includes('address') || query.includes('funding')) {
      return `To fund your account, visit the "Deposit Funds" section on your dashboard, select your preferred crypto asset (USDT, BTC, ETH, SOL, etc.), and send funds to the designated official treasury address.`;
    }

    if (query.includes('kyc') || query.includes('identity') || query.includes('verify') || query.includes('document')) {
      return `KYC Identity Verification: Navigate to "Account Profile & KYC" on your dashboard to submit your Government ID / Passport and Proof of Address. Our compliance officers review submissions within 15–30 minutes.`;
    }

    if (query.includes('tier') || query.includes('upgrade') || query.includes('limit')) {
      return `Account Tiers: Upgrading your tier increases your single-transaction and liquidity reception limit. You can select your desired tier in the upgrade portal or request an officer to adjust your account limits.`;
    }

    if (query.includes('human') || query.includes('agent') || query.includes('specialist') || query.includes('admin') || query.includes('talk') || query.includes('live')) {
      return `I have flagged your ticket for an Institutional Support Officer. A specialist has been notified and will reply directly in this chat shortly. Please stay on this window.`;
    }

    if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('good')) {
      return `Hello ${userName || 'Trader'}! Thank you for reaching out to Quibands Global VIP Support. How may I assist you with your mining portfolio or account transactions today?`;
    }

    return `Thank you for your message. I have logged your request: "${text}". A dedicated support specialist has been assigned to your ticket and will respond shortly. If this is urgent, please provide any relevant transaction hashes or reference IDs.`;
  }
}

export const supportService = new SupportService();
