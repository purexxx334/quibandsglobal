import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle } from 'lucide-react';

declare global {
  interface Window {
    _smartsupp?: any;
    smartsupp?: any;
  }
}

interface SmartsuppChatProps {
  adminHubOpen?: boolean;
}

export const SmartsuppChat: React.FC<SmartsuppChatProps> = ({ adminHubOpen = false }) => {
  const { user, profile } = useAuth();

  // Synchronize Logged-in Trader Profile Data with Smartsupp (Option B)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.smartsupp !== 'function') return;

    if (user) {
      const userName = profile?.full_name || profile?.username || user.email?.split('@')[0] || 'Trader';
      const userEmail = user.email || '';

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

      try {
        window.smartsupp('name', userName);
        window.smartsupp('email', userEmail);
        window.smartsupp('variables', syncVars);
      } catch (e) {
        console.warn('Smartsupp user sync warning:', e);
      }
    }
  }, [user, profile]);

  // Hide widget inside Admin Control Hub so it doesn't obstruct admin tools
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.smartsupp !== 'function') return;

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
        className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-2xl shadow-blue-600/40 hover:shadow-blue-500/60 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/30 cursor-pointer"
        title="Live Chat"
        aria-label="Open Live Chat"
        type="button"
      >
        <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white/15 transition-transform group-hover:scale-110" />
        <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-blue-600 animate-pulse" />
      </button>
    </div>
  );
};

// Global helper to open native Smartsupp chat directly
export const openSmartsuppChat = () => {
  if (typeof window === 'undefined') return;

  // 1. Trigger Smartsupp JS API to open native chat
  if (typeof window.smartsupp === 'function') {
    try {
      window.smartsupp('chat:show');
      window.smartsupp('chat:open');
      window.smartsupp('open');
    } catch (e) {
      console.warn('Smartsupp open warning:', e);
    }
  }

  // 2. Direct click on native Smartsupp DOM iframe/button if present in DOM
  try {
    const el = document.querySelector('#smartsupp-widget, iframe[id*="smartsupp"], iframe[name*="smartsupp"], iframe[title*="Smartsupp"], button[aria-label*="chat" i], div[id*="smartsupp-widget"]') as HTMLElement;
    if (el) {
      el.click();
    }
  } catch (domErr) {
    // ignore
  }
};
