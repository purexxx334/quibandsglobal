import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle } from 'lucide-react';

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

  // 1. Initialize Smartsupp Script
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

  // 3. Hide widget when inside Admin Control Hub
  useEffect(() => {
    if (typeof window === 'undefined' || !window.smartsupp) return;

    try {
      if (adminHubOpen) {
        window.smartsupp('chat:hide');
      } else {
        window.smartsupp('chat:show');
      }
    } catch (e) {
      // ignore
    }
  }, [adminHubOpen]);

  // Don't show in Admin Hub
  if (adminHubOpen) return null;

  return (
    /* Guaranteed Blue Floating Chat Launcher Button */
    <div className="fixed bottom-5 right-5 z-[99999] notranslate" translate="no">
      <button
        onClick={openSmartsuppChat}
        className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/20"
        title="Live Chat"
        aria-label="Open Live Chat"
      >
        <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white/10 transition-transform group-hover:scale-110" />
        <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-blue-600 animate-pulse" />
      </button>
    </div>
  );
};

// Global helper to open native Smartsupp chat directly without page navigation
export const openSmartsuppChat = () => {
  if (typeof window === 'undefined') return;

  // 1. Trigger Smartsupp JS API to open floating native chat window on the current page
  if (typeof window.smartsupp === 'function') {
    try {
      window.smartsupp('chat:show');
      window.smartsupp('chat:open');
      window.smartsupp('open');
    } catch (e) {
      console.warn('Smartsupp open warning:', e);
    }
  }

  // 2. Direct click on native Smartsupp DOM iframe/button if present
  try {
    const el = document.querySelector('#smartsupp-widget, iframe[id*="smartsupp"], iframe[name*="smartsupp"], button[aria-label*="chat" i]') as HTMLElement;
    if (el) {
      el.click();
    }
  } catch (domErr) {
    // ignore
  }
};
