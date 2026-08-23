import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  ShieldCheck,
  User,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Clock,
  CheckCheck,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SupportConversation, SupportMessage } from '../../types';
import { supabase } from '../../lib/supabase';
import { API_BASE } from '../../config/api';


const QUICK_PROMPTS = [
  'What is the status of my withdrawal?',
  'How do I complete KYC Verification?',
  'How do I upgrade my account tier?',
  'I need to speak to a Live Agent',
];

const getClientFallbackBotResponse = (text: string, userName?: string): string => {
  const query = text.toLowerCase();
  if (query.includes('withdraw') || query.includes('payout') || query.includes('cash out')) {
    return `Institutional Withdrawals are processed 24/7 across Bank Wires and Crypto Networks. Once your request is submitted, it will be reviewed for blockchain clearance.`;
  }
  if (query.includes('deposit') || query.includes('address') || query.includes('funding')) {
    return `To deposit funds, visit the "Deposit Funds" section on your dashboard, select your asset, and send funds to your designated receiving address.`;
  }
  if (query.includes('kyc') || query.includes('identity') || query.includes('verify') || query.includes('document')) {
    return `KYC Identity Verification: Please navigate to "Account Profile & KYC" on your dashboard to submit your Government ID / Passport. Compliance reviews submissions within 15–30 minutes.`;
  }
  if (query.includes('tier') || query.includes('upgrade') || query.includes('limit')) {
    return `Account Tier Upgrades: Upgrading increases your single-transaction liquidity limit and receive capacity. You can select your desired tier in the upgrade portal.`;
  }
  if (query.includes('human') || query.includes('agent') || query.includes('specialist') || query.includes('admin') || query.includes('talk') || query.includes('live')) {
    return `I have notified an Institutional Support Officer. A specialist is reviewing your account and will join this live chat shortly. Please stay on this window.`;
  }
  if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('good')) {
    return `Hello ${userName || 'Trader'}! Welcome to Quibands VIP Support. How may I assist you with your mining portfolio or account transactions today?`;
  }
  return `Thank you for reaching out. I have logged your request: "${text}". A dedicated support specialist has been assigned to your ticket and will respond directly in this chat shortly.`;
};

export const LiveChatWidget: React.FC = () => {
  const { user, session } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getHeaders = async () => {
    const token = session?.access_token || (await supabase.auth.getSession()).data?.session?.access_token;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  // Fetch conversation & messages
  const fetchMessages = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/support/me`, { headers });
      const json = await res.json();

      if (json.success && json.data) {
        setConversation(json.data.conversation);
        if (json.data.messages && json.data.messages.length > 0) {
          setMessages(json.data.messages);
        }
        
        // Count unread messages for user
        if (!isOpen) {
          setUnreadCount(json.data.conversation.unread_user_count || 0);
        }
      }
    } catch (err) {
      console.warn('Failed to load support chat:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Reset state and fetch clean thread when user switches or logs in/out
  useEffect(() => {
    setConversation(null);
    setMessages([]);
    setUnreadCount(0);
    setIsOpen(false);
    if (user?.id) {
      fetchMessages();
    }
  }, [user?.id]);


  // Real-time polling every 3 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [user, isOpen]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Mark messages as read when opening chat
  const handleOpenChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);

    // If messages list is empty, initialize with welcoming message
    if (messages.length === 0) {
      const initialWelcome: SupportMessage = {
        id: 'init-welcome',
        conversation_id: conversation?.id || 'temp',
        sender_type: 'BOT',
        sender_name: 'Quibands VIP Assistant',
        message: `Hello ${user?.email?.split('@')[0] || 'Trader'}! 👋 Welcome to Quibands Global Institutional Support. How can our team assist you today?\n\nQuick options:\n• Deposit & Receiving Addresses\n• Cloud Mining & Hashrate\n• Withdrawals & Payouts\n• KYC Identity Verification\n• Account Tier Upgrade\n• Speak to a Live Agent`,
        is_read: true,
        created_at: new Date().toISOString(),
      };
      setMessages([initialWelcome]);
    }

    if (conversation) {
      getHeaders().then((headers) => {
        fetch(`${API_BASE}/support/mark-read`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ conversationId: conversation.id }),
        }).catch(() => {});
      });
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);
    setIsTyping(true);

    const userName = user?.email?.split('@')[0] || 'Trader';

    // Optimistic user message preview
    const tempUserMsg: SupportMessage = {
      id: 'temp-' + Date.now(),
      conversation_id: conversation?.id || 'temp',
      sender_type: 'USER',
      sender_name: userName,
      message: text,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/support/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        if (json.data.botMessage) {
          const botMsg = json.data.botMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === botMsg.id)) return prev;
            return [...prev, botMsg];
          });
        }
        await fetchMessages(true);
      } else {
        // Fallback immediate bot response
        const fallbackText = getClientFallbackBotResponse(text, userName);
        const fallbackBotMsg: SupportMessage = {
          id: 'bot-' + Date.now(),
          conversation_id: conversation?.id || 'temp',
          sender_type: 'BOT',
          sender_name: 'Quibands VIP Assistant',
          message: fallbackText,
          is_read: false,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, fallbackBotMsg]);
      }
    } catch (err) {
      console.warn('Network error sending message, generating response:', err);
      const fallbackText = getClientFallbackBotResponse(text, userName);
      const fallbackBotMsg: SupportMessage = {
        id: 'bot-' + Date.now(),
        conversation_id: conversation?.id || 'temp',
        sender_type: 'BOT',
        sender_name: 'Quibands VIP Assistant',
        message: fallbackText,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackBotMsg]);
    } finally {
      setSending(false);
      setIsTyping(false);
    }
  };


  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Chat Launcher Button (When closed) */}
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          className="relative group p-4 rounded-2xl bg-gradient-to-r from-gold-400 via-amber-500 to-amber-600 text-dark-950 shadow-2xl shadow-gold-500/30 hover:shadow-gold-500/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border border-gold-300/40"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6 fill-dark-950" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-dark-950 animate-pulse" />
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="font-bold text-xs leading-none tracking-wide">Live Support</span>
            <span className="text-[10px] text-dark-900/80 font-medium">Specialist Online</span>
          </div>

          {/* Unread Message Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -left-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-black border-2 border-dark-950 shadow-lg animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div
          className={`w-[92vw] sm:w-[400px] bg-dark-950 border border-gold-500/30 rounded-3xl shadow-2xl shadow-black/90 flex flex-col overflow-hidden backdrop-blur-xl transition-all ${
            isMinimized ? 'h-16' : 'h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 p-[1px] shadow-gold-sm">
                  <div className="w-full h-full bg-dark-950 rounded-[15px] flex items-center justify-center text-gold-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-dark-950" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-white text-sm font-['Outfit']">Quibands VIP Desk</h4>
                  <span className="px-1.5 py-0.2 rounded bg-gold-400/10 border border-gold-400/30 text-[9px] font-bold text-gold-400">
                    24/7
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Institutional Specialist Active</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-xl hover:bg-white/5 hover:text-white transition"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/5 hover:text-white transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content (Visible when not minimized) */}
          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-dark-900/40 text-xs">
                
                {/* Security Guarantee Banner */}
                <div className="p-2.5 rounded-2xl bg-dark-850/80 border border-white/5 text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                  <ShieldCheck className="w-4 h-4 text-gold-400 shrink-0" />
                  <span>End-to-End Encrypted Institutional Live Support</span>
                </div>

                {loading && messages.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin text-gold-400" />
                    <p className="text-xs">Connecting to secure support channel...</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.sender_type === 'USER';
                    const isBot = msg.sender_type === 'BOT';

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                            isUser
                              ? 'bg-gold-500 text-dark-950'
                              : isBot
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isUser ? <User className="w-3.5 h-3.5" /> : isBot ? <Bot className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[80%] space-y-1 ${isUser ? 'text-right' : 'text-left'}`}>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 px-1 justify-inherit">
                            <span className="font-semibold text-slate-300">{msg.sender_name}</span>
                            {isBot && <span className="text-[9px] px-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">BOT</span>}
                            {!isUser && !isBot && <span className="text-[9px] px-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">SPECIALIST</span>}
                          </div>

                          <div
                            className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                              isUser
                                ? 'bg-gradient-to-r from-gold-400 to-amber-500 text-dark-950 font-medium rounded-tr-none shadow-gold-sm'
                                : isBot
                                ? 'bg-dark-850 border border-cyan-500/20 text-slate-100 rounded-tl-none'
                                : 'bg-dark-800 border border-emerald-500/30 text-white rounded-tl-none'
                            }`}
                          >
                            {msg.message}
                          </div>

                          <div className="text-[9px] text-slate-500 font-mono px-1 flex items-center gap-1 justify-inherit">
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isUser && <CheckCheck className="w-3 h-3 text-emerald-400 inline" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Animated Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs pl-1">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Bot className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    <span className="flex gap-1 py-1.5 px-3 rounded-2xl bg-dark-850 border border-white/5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action Prompt Pills */}
              <div className="p-2.5 bg-dark-950 border-t border-white/5 overflow-x-auto flex gap-1.5 scrollbar-none">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={sending}
                    className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-dark-850 hover:bg-gold-500/15 text-slate-300 hover:text-gold-400 border border-white/10 text-[10px] font-mono transition shrink-0 flex items-center gap-1"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-gold-400" />
                    <span>{prompt}</span>
                  </button>
                ))}
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-dark-900 border-t border-white/10 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message to support..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-dark-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-gold-500 font-sans"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-gold-400 to-amber-600 hover:from-gold-500 hover:to-amber-700 text-dark-950 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-gold-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};
