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

  // 1. Initialize Smartsupp Script cleanly & ensure native blue button is visible
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
    } else {
      try {
        window.smartsupp('chat:show');
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // 2. Synchronize user profile with Smartsupp
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

  // Render purely native Smartsupp widget
  return null;
};

// Global helper to open native Smartsupp chat directly from Contact buttons or nav
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

  try {
    const el = document.querySelector('#smartsupp-widget, iframe[id*="smartsupp"], iframe[name*="smartsupp"], button[aria-label*="chat" i]') as HTMLElement;
    if (el) {
      el.click();
    }
  } catch (domErr) {
    // ignore
  }
};
