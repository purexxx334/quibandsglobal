import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, X, ShieldCheck, ExternalLink } from 'lucide-react';

declare global {
  interface Window {
    _smartsupp?: any;
    smartsupp?: any;
  }
}

const SMARTSUPP_KEY = '3cdeb6680f2bbdf23ceab58462afab7133653b98';

interface SmartsuppChatProps {
  adminHubOpen?: boolean;
}

export const SmartsuppChat: React.FC<SmartsuppChatProps> = ({ adminHubOpen = false }) => {
  const { user, profile } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  // 1. Initialize Smartsupp Script in background
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window._smartsupp = window._smartsupp || {};
    window._smartsupp.key = SMARTSUPP_KEY;
    window._smartsupp.hideOffline = false;

    if (!window.smartsupp) {
      const o: any = (window.smartsupp = function () {
        o._.push(arguments);
      });
      o._ = [];

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.charset = 'utf-8';
      script.async = true;
      script.src = 'https://www.smartsuppchat.com/loader.js?';

      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }
    }
  }, []);

  // 2. Identify Logged-in User in Smartsupp Agent Dashboard
  useEffect(() => {
    if (typeof window === 'undefined' || !window.smartsupp) return;

    if (user) {
      const userName = profile?.full_name || profile?.username || user.email?.split('@')[0] || 'Trader';
      const userEmail = user.email || '';

      try {
        window.smartsupp('name', userName);
        window.smartsupp('email', userEmail);
        window.smartsupp('variables', {
          AccountTier: profile?.account_tier || 'BASIC',
          TotalBalance: `$${Number(profile?.total_balance ?? profile?.main_balance ?? 0).toLocaleString()}`,
          MiningBalance: `$${Number(profile?.mining_balance ?? 0).toLocaleString()}`,
          ProfitBalance: `$${Number(profile?.profit_balance ?? 0).toLocaleString()}`,
          KYCStatus: profile?.kyc_status || 'NOT_SUBMITTED',
          UserId: user.id
        });
      } catch (e) {
        // ignore
      }
    }
  }, [user, profile]);

  // Handler to open chat on all devices
  const handleOpenChat = () => {
    let triggered = false;

    if (typeof window !== 'undefined' && typeof window.smartsupp === 'function') {
      try {
        window.smartsupp('chat:show');
        window.smartsupp('chat:open');
        window.smartsupp('open');
        triggered = true;
      } catch (e) {
        console.warn('Smartsupp API trigger warning:', e);
      }
    }

    // Also check for existing Smartsupp DOM iframe
    try {
      const el = document.querySelector('#smartsupp-widget, iframe[id*="smartsupp"], iframe[name*="smartsupp"]') as HTMLElement;
      if (el) {
        el.click();
        triggered = true;
      }
    } catch (domErr) {
      // ignore
    }

    // Fallback: If Smartsupp is blocked by adblocker/browser on PC or slow network, toggle the embedded modal
    setTimeout(() => {
      // Check if native smartsupp window opened (by looking for active expanded iframe)
      const openFrame = document.querySelector('iframe[id*="smartsupp"][style*="display: block"], iframe[id*="smartsupp"][style*="height"]') as HTMLElement;
      if (!openFrame && !triggered) {
        setModalOpen(true);
      }
    }, 150);
  };

  // If inside Admin Hub, don't show the user-facing chat bubble
  if (adminHubOpen) return null;

  return (
    <>
      {/* Universal Floating Live Support Chat Button */}
      <div className="fixed bottom-5 right-5 z-[99999] notranslate" translate="no">
        <button
          onClick={handleOpenChat}
          className="group flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-gold-500 via-amber-500 to-gold-400 hover:from-gold-400 hover:to-amber-300 text-dark-950 font-bold font-mono text-xs sm:text-sm shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-gold-300/60"
          title="Chat with 24/7 Live Support"
          id="quibands-live-chat-btn"
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-dark-950 fill-dark-950/20" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
          </div>
          <span className="tracking-wide">24/7 Live Support</span>
        </button>
      </div>

      {/* Direct Smartsupp Embedded Modal (Always works on any PC/Mobile regardless of script blockers) */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-end sm:justify-end p-2 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full sm:w-[400px] h-[580px] max-h-[90vh] bg-dark-950 border border-gold-500/40 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-dark-900 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Quibands Live Support</h4>
                  <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Support Specialist Online
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://www.smartsupp.com/widget/${SMARTSUPP_KEY}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white text-xs"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white"
                  title="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Smartsupp Webframe */}
            <iframe
              src={`https://www.smartsupp.com/widget/${SMARTSUPP_KEY}`}
              title="Smartsupp Live Chat"
              className="w-full flex-1 border-0 bg-dark-950"
              allow="microphone; camera"
            />

            {/* Security Footer */}
            <div className="px-4 py-2 bg-dark-900/80 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Encrypted Session
              </span>
              <span>Quibands Global VIP Desk</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Global helper to open Smartsupp chat from anywhere (e.g., Contact Support buttons)
export const openSmartsuppChat = () => {
  if (typeof window === 'undefined') return;

  // 1. Try Smartsupp API
  if (typeof window.smartsupp === 'function') {
    try {
      window.smartsupp('chat:show');
      window.smartsupp('chat:open');
      window.smartsupp('open');
    } catch (e) {
      // ignore
    }
  }

  // 2. Click existing floating button in DOM
  const btn = document.getElementById('quibands-live-chat-btn');
  if (btn) {
    btn.click();
  }
};
