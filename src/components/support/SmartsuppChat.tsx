import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

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

  // 1. Initialize Smartsupp Script cleanly
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

  // 2. Forward Logged-in Trader Profile Metadata to Smartsupp Agent App
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

  return null;
};

// Global helper to open native Smartsupp chat directly from anywhere
export const openSmartsuppChat = () => {
  if (typeof window === 'undefined') return;

  if (typeof window.smartsupp === 'function') {
    try {
      window.smartsupp('chat:show');
      window.smartsupp('chat:open');
    } catch (e) {
      console.warn('Smartsupp open error:', e);
    }
  }

  // Also trigger click on native Smartsupp launcher element if present in DOM
  try {
    const el = document.querySelector('#smartsupp-widget, iframe[id*="smartsupp"], iframe[name*="smartsupp"], button[aria-label*="chat" i]') as HTMLElement;
    if (el) {
      el.click();
    }
  } catch (domErr) {
    // ignore
  }
};
