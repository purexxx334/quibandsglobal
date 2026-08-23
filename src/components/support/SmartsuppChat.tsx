import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare } from 'lucide-react';

declare global {
  interface Window {
    _smartsupp?: any;
    smartsupp?: any;
  }
}

const SMARTSUPP_KEY = '3cdeb6680f2bbdf23ceab58462afab7133653b98';

// Module-level storage for active user data so openSmartsuppChat always has fresh trader credentials
let activeUserSnapshot: { user: any; profile: any } = { user: null, profile: null };

interface SmartsuppChatProps {
  adminHubOpen?: boolean;
}

export const SmartsuppChat: React.FC<SmartsuppChatProps> = ({ adminHubOpen = false }) => {
  const { user, profile } = useAuth();

  // Keep snapshot updated
  useEffect(() => {
    activeUserSnapshot = { user, profile };
  }, [user, profile]);

  // 1. Initialize Smartsupp Script with User Credentials attached to global config
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

  // 2. Continuous Synchronization whenever Auth State or Profile changes
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
          console.warn('Smartsupp user sync warning:', e);
        }
      }
    }
  }, [user, profile]);

  // 3. Hide Smartsupp widget when inside Admin Control Hub so it doesn't obstruct admin tools
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

  // If inside Admin Hub, don't show the user-facing chat button
  if (adminHubOpen) return null;

  return (
    /* Permanent Universal Floating Live Support Chat Button */
    <div className="fixed bottom-5 right-5 z-[99999] notranslate" translate="no">
      <button
        onClick={openSmartsuppChat}
        className="group flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-gold-500 via-amber-500 to-gold-400 hover:from-gold-400 hover:to-amber-300 text-dark-950 font-bold font-mono text-xs sm:text-sm shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-gold-300/60"
        title="Chat with 24/7 Live Support"
      >
        <div className="relative flex items-center justify-center">
          <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-dark-950 fill-dark-950/20" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
        </div>
        <span className="tracking-wide">24/7 Live Support</span>
      </button>
    </div>
  );
};

// Global helper to open native Smartsupp chat directly with active user metadata
export const openSmartsuppChat = () => {
  if (typeof window === 'undefined') return;

  const { user, profile } = activeUserSnapshot;

  // 1. Force push fresh trader metadata immediately before opening
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

  // 2. Trigger Smartsupp JS API to open native chat
  if (typeof window.smartsupp === 'function') {
    try {
      window.smartsupp('chat:show');
      window.smartsupp('chat:open');
      window.smartsupp('open');
    } catch (e) {
      console.warn('Smartsupp open warning:', e);
    }
  }

  // 3. Direct click on any rendered native Smartsupp launcher in DOM
  try {
    const el = document.querySelector('#smartsupp-widget, iframe[id*="smartsupp"], iframe[name*="smartsupp"], button[aria-label*="chat" i]') as HTMLElement;
    if (el) {
      el.click();
    }
  } catch (domErr) {
    // ignore
  }

  // 4. Fallback: If on mobile/PC and native popup hasn't opened after 350ms, open the direct Smartsupp URL with user pre-filled
  setTimeout(() => {
    const isExpanded = document.querySelector('iframe[id*="smartsupp"][style*="display: block"], iframe[id*="smartsupp"][style*="height"]');
    if (!isExpanded) {
      const emailParam = user?.email ? `&email=${encodeURIComponent(user.email)}` : '';
      const nameParam = profile?.full_name ? `&name=${encodeURIComponent(profile.full_name)}` : '';
      window.open(`https://www.smartsupp.com/widget/${SMARTSUPP_KEY}?${emailParam}${nameParam}`, '_blank');
    }
  }, 400);
};
