import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  ShieldCheck,
  Search,
  RefreshCw,
  Sparkles,
  Clock,
  CheckCheck,
  Power,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { SupportConversation, SupportMessage } from '../../types';
import { API_BASE } from '../../config/api';

interface AdminSupportChatTabProps {
  getHeaders: () => Promise<Record<string, string>>;
}


const CANNED_REPLIES = [
  'Hello! Compliance has received your gas fee payment reference and is currently verifying on-chain.',
  'Your KYC documents have been reviewed and identity verified. Your account is now fully active.',
  'Your tier upgrade request has been approved. You can now proceed with your withdrawal.',
  'Please ensure you copy the exact treasury address provided under your deposit tab.',
  'A senior account manager has been assigned to your case and will follow up shortly.',
];

export const AdminSupportChatTab: React.FC<AdminSupportChatTabProps> = ({ getHeaders }) => {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [replyText, setReplyText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/support/admin/conversations`, { headers });
      const json = await res.json();

      if (json.success && json.data) {
        setConversations(json.data);
        
        // If a conversation is currently selected, update its local object
        if (selectedConv) {
          const updated = json.data.find((c: SupportConversation) => c.id === selectedConv.id);
          if (updated) setSelectedConv(updated);
        } else if (json.data.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1024) {
          // Select first conversation by default on desktop only
          setSelectedConv(json.data[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to load admin conversations:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch messages for selected conversation
  const fetchSelectedMessages = async (convId: string, silent = false) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/support/admin/conversations/${convId}/messages`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        setMessages(json.data);
      }
    } catch (err) {
      console.warn('Failed to load conversation messages:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Poll conversations and messages every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(true);
      if (selectedConv) {
        fetchSelectedMessages(selectedConv.id, true);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [selectedConv?.id]);

  // Load messages when selectedConv changes
  useEffect(() => {
    if (selectedConv) {
      fetchSelectedMessages(selectedConv.id);
    }
  }, [selectedConv?.id]);


  // Send admin reply
  const handleSendReply = async () => {
    if (!selectedConv || !replyText.trim() || sending) return;
    setSending(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/support/admin/conversations/${selectedConv.id}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: replyText.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMessages((prev) => [...prev, json.data]);
        setReplyText('');
        fetchConversations(true);
      }
    } catch (err) {
      console.warn('Failed to send admin reply:', err);
    } finally {
      setSending(false);
    }
  };

  // Toggle Bot automation for this user
  const handleToggleBot = async () => {
    if (!selectedConv) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/support/admin/conversations/${selectedConv.id}/bot`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isBotActive: !selectedConv.is_bot_active }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedConv((prev) => prev ? { ...prev, is_bot_active: !prev.is_bot_active } : null);
        fetchConversations(true);
      }
    } catch (err) {
      console.warn('Failed to toggle bot:', err);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.user_email.toLowerCase().includes(q) ||
      (c.user_name && c.user_name.toLowerCase().includes(q)) ||
      (c.last_message && c.last_message.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex overflow-hidden font-sans text-xs w-full">
      {/* Left Sidebar: Conversations List (Hidden on Mobile when a ticket is opened) */}
      <div className={`w-full lg:w-80 border-r border-white/10 flex-col bg-dark-950/60 overflow-hidden shrink-0 ${
        selectedConv ? 'hidden lg:flex' : 'flex'
      }`}>
        
        {/* Header & Search */}
        <div className="p-3 sm:p-4 border-b border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gold-400" />
              <h3 className="font-bold text-white text-sm font-mono">Live Support Tickets</h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-gold-400/10 border border-gold-400/30 text-[10px] font-bold text-gold-400">
              {conversations.length} Active
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user or message..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-dark-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {filteredConversations.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConv?.id === conv.id;
              const hasUnread = conv.unread_admin_count > 0;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full p-3.5 sm:p-4 text-left transition-all flex items-start gap-3 relative active:scale-[0.99] ${
                    isSelected ? 'bg-gold-500/10 border-l-2 border-gold-400' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-dark-850 border border-white/10 flex items-center justify-center shrink-0 font-bold text-white uppercase text-xs">
                    {conv.user_name ? conv.user_name[0] : conv.user_email[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-white text-xs truncate">
                        {conv.user_name || 'Trader'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono truncate mb-1">
                      {conv.user_email}
                    </div>

                    <p className="text-[11px] text-slate-300 truncate font-sans">
                      {conv.last_message || 'New conversation'}
                    </p>

                    <div className="flex items-center gap-1.5 mt-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          conv.status === 'PENDING_ADMIN'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {conv.status}
                      </span>

                      {conv.is_bot_active && (
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[9px] font-mono flex items-center gap-1">
                          <Bot className="w-2.5 h-2.5" /> Bot Active
                        </span>
                      )}
                    </div>
                  </div>

                  {hasUnread && (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse absolute top-4 right-3" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area: Active Chat Conversation Thread (Hidden on mobile if no ticket is selected) */}
      {selectedConv ? (
        <div className={`flex-1 flex-col bg-dark-900/30 overflow-hidden w-full ${
          !selectedConv ? 'hidden lg:flex' : 'flex'
        }`}>
          
          {/* Active Chat Header */}
          <div className="p-3 sm:p-4 bg-dark-950 border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Back to Tickets Button on Mobile */}
              <button
                onClick={() => setSelectedConv(null)}
                className="lg:hidden p-2 rounded-xl bg-dark-850 hover:bg-dark-800 border border-white/10 text-gold-400 hover:text-white flex items-center gap-1 font-mono text-xs shrink-0 active:scale-95 transition"
                title="Back to Tickets"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Tickets</span>
              </button>

              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400 font-bold text-sm shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h4 className="font-bold text-white text-xs sm:text-sm truncate">{selectedConv.user_name || 'Trader'}</h4>
                  <span className="text-slate-400 font-mono text-[10px] sm:text-xs truncate max-w-[140px] sm:max-w-none">({selectedConv.user_email})</span>
                  {selectedConv.user_profile?.account_tier && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold">
                      {selectedConv.user_profile.account_tier}
                    </span>
                  )}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                  Bal: <strong className="text-emerald-400">${(selectedConv.user_profile?.total_balance || (selectedConv.user_profile?.main_balance || 0)).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Bot Toggle Switch */}
              <button
                onClick={handleToggleBot}
                className={`px-2 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 transition ${
                  selectedConv.is_bot_active
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
                title={selectedConv.is_bot_active ? 'Click to disable Bot automation' : 'Click to enable Bot automation'}
              >
                <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Bot:</span>
                <span>{selectedConv.is_bot_active ? 'ON' : 'PAUSED'}</span>
              </button>

              <button
                onClick={() => fetchSelectedMessages(selectedConv.id)}
                className="p-1.5 sm:p-2 rounded-xl bg-dark-850 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition"
                title="Refresh messages"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>


          {/* Message Thread */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 font-sans">
            {messages.length === 0 ? (
              <div className="py-16 text-center text-slate-500 font-mono">
                No messages recorded in this support ticket yet.
              </div>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.sender_type === 'ADMIN';
                const isBot = msg.sender_type === 'BOT';
                const isUser = msg.sender_type === 'USER';

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isAdmin
                          ? 'bg-emerald-500 text-dark-950 font-bold'
                          : isBot
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-gold-500 text-dark-950 font-bold'
                      }`}
                    >
                      {isAdmin ? <ShieldCheck className="w-4 h-4" /> : isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div className={`max-w-[75%] space-y-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 px-1 justify-inherit">
                        <span className="font-semibold text-slate-300">{msg.sender_name}</span>
                        {isBot && <span className="text-[9px] px-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">AI BOT</span>}
                        {isAdmin && <span className="text-[9px] px-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">SUPERADMIN</span>}
                        {isUser && <span className="text-[9px] px-1 rounded bg-gold-400/10 text-gold-400 border border-gold-400/20">CLIENT</span>}
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                          isAdmin
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-tr-none shadow-lg'
                            : isBot
                            ? 'bg-dark-850 border border-cyan-500/30 text-slate-200 rounded-tl-none'
                            : 'bg-dark-800 border border-gold-400/30 text-white rounded-tl-none'
                        }`}
                      >
                        {msg.message}
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono px-1">
                        {new Date(msg.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Canned Quick Response Presets */}
          <div className="p-3 bg-dark-950 border-t border-white/5 overflow-x-auto flex gap-2">
            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold self-center shrink-0">
              Quick Reply:
            </span>
            {CANNED_REPLIES.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => setReplyText(reply)}
                className="whitespace-nowrap px-3 py-1 rounded-xl bg-dark-850 hover:bg-gold-500/15 text-slate-300 hover:text-gold-400 border border-white/10 text-[11px] font-sans transition shrink-0"
              >
                {reply.substring(0, 35)}...
              </button>
            ))}
          </div>

          {/* Admin Reply Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendReply();
            }}
            className="p-2.5 sm:p-4 bg-dark-950 border-t border-white/10 flex items-center gap-2 sm:gap-3"
          >
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${selectedConv.user_name || selectedConv.user_email}...`}
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-dark-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 font-sans min-w-0"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || sending}
              className="px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 shrink-0 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send Live Reply'}</span>
              <span className="sm:hidden">{sending ? '...' : 'Send'}</span>
            </button>
          </form>


        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-500 font-mono">
          Select a user conversation from the left to start live chatting.
        </div>
      )}
    </div>
  );
};
