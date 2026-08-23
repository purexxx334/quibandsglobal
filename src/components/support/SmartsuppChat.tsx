import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, ChevronDown, X } from 'lucide-react';

declare global {
  interface Window {
    _smartsupp?: any;
    smartsupp?: any;
    openSmartsuppModalGlobal?: () => void;
  }
}

const SMARTSUPP_KEY = '3cdeb6680f2bbdf23ceab58462afab7133653b98';

interface SmartsuppChatProps {
  adminHubOpen?: boolean;
}

export const SmartsuppChat: React.FC<SmartsuppChatProps> = ({ adminHubOpen = false }) => {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Expose global open handler for navbar/contact buttons
  useEffect(() => {
    window.openSmartsuppModalGlobal = () => {
      setIsOpen(true);
    };
    return () => {
      window.openSmartsuppModalGlobal = undefined;
    };
  }, []);

  // 1. Initialize Smartsupp Script for background agent tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window._smartsupp = window._smartsupp || {};
    window._smartsupp.key = SMARTSUPP_KEY;
    window._smartsupp.hideOffline = false;

    if (user) {
      const userName = profile?.full_name || profile?.username || user.email?.split('@')[0] || 'Trader';
      const userEmail = user.email || '';
      window._smartsupp.name = userName;
      window._smartsupp.email = userEmail;
      window._smartsupp.variables = {
        'Trader Email': userEmail,
        'Full Name': userName,
        'Account Tier': profile?.account_tier || 'BASIC',
        'Total Balance': `$${Number(profile?.total_balance ?? profile?.main_balance ?? 0).toLocaleString()}`,
        'Mining Balance': `$${Number(profile?.mining_balance ?? 0).toLocaleString()}`,
        'Profit Balance': `$${Number(profile?.profit_balance ?? 0).toLocaleString()}`,
        'KYC Status': profile?.kyc_status || 'NOT_SUBMITTED',
        'User ID': user.id
      };
    }

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

  // 2. Continuous Profile Synchronization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (user) {
      const userName = profile?.full_name || profile?.username || user.email?.split('@')[0] || 'Trader';
      const userEmail = user.email || '';

      window._smartsupp = window._smartsupp || {};
      window._smartsupp.name = userName;
      window._smartsupp.email = userEmail;

      const syncVars = {
        'Trader Email': userEmail,
        'Full Name': userName,
        'Account Tier': profile?.account_tier || 'BASIC',
        'Total Balance': `$${Number(profile?.total_balance ?? profile?.main_balance ?? 0).toLocaleString()}`,
        'Mining Balance': `$${Number(profile?.mining_balance ?? 0).toLocaleString()}`,
        'Profit Balance': `$${Number(profile?.profit_balance ?? 0).toLocaleString()}`,
        'KYC Status': profile?.kyc_status || 'NOT_SUBMITTED',
        'User ID': user.id
      };
      window._smartsupp.variables = syncVars;

      if (typeof window.smartsupp === 'function') {
        try {
          window.smartsupp('name', userName);
          window.smartsupp('email', userEmail);
          window.smartsupp('variables', syncVars);
        } catch (e) {
          // ignore
        }
      }
    }
  }, [user, profile]);

  // Don't show in Admin Hub
  if (adminHubOpen) return null;

  // Compute pre-filled Smartsupp widget URL
  const emailParam = user?.email ? `&email=${encodeURIComponent(user.email)}` : '';
  const nameParam = profile?.full_name || profile?.username ? `&name=${encodeURIComponent(profile?.full_name || profile?.username || '')}` : '';
  const widgetUrl = `https://www.smartsupp.com/widget/${SMARTSUPP_KEY}?${emailParam}${nameParam}`;

  return (
    <>
      {/* 1. Guaranteed Blue Circular Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-[99999] notranslate" translate="no">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-2xl shadow-blue-600/40 hover:shadow-blue-500/60 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/30"
            title="Live Chat"
            aria-label="Open Live Chat"
          >
            <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white/15 transition-transform group-hover:scale-110" />
            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-blue-600 animate-pulse" />
          </button>
        </div>
      )}

      {/* 2. Floating In-Page Smartsupp Chat Panel (Keeps User on Dashboard) */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[400px] sm:h-[600px] sm:max-h-[88vh] z-[100000] flex flex-col bg-white rounded-none sm:rounded-2xl shadow-2xl overflow-hidden border border-blue-500/20 animate-fadeIn notranslate" translate="no">
          {/* Native Blue Smartsupp Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base border border-white/30">
                  Q
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide leading-tight">QuibandsGlobal</h3>
                <p className="text-[11px] text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  We reply immediately
                </p>
              </div>
            </div>

            {/* Minimize / Close buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors"
                title="Minimize chat"
                aria-label="Minimize chat"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Embedded Full Live Chat */}
          <div className="flex-1 w-full h-full bg-slate-50 relative">
            <iframe
              src={widgetUrl}
              title="Quibands Live Chat"
              className="w-full h-full border-0"
              allow="microphone; camera"
            />
          </div>
        </div>
      )}
    </>
  );
};

// Global helper to open native Smartsupp chat directly
export const openSmartsuppChat = () => {
  if (typeof window !== 'undefined' && typeof window.openSmartsuppModalGlobal === 'function') {
    window.openSmartsuppModalGlobal();
  }
};
