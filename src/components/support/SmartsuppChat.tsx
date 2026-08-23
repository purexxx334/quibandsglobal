import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

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

  // 1. Initialize Smartsupp Script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window._smartsupp = window._smartsupp || {};
    window._smartsupp.key = '3cdeb6680f2bbdf23ceab58462afab7133653b98';

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

    }
  }, [user, profile]);

  // 3. Hide Smartsupp widget when Admin Control Hub is open so it doesn't obstruct admin workspace
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

// Global helper to open Smartsupp chat from anywhere across PC and Mobile
export const openSmartsuppChat = () => {
  if (typeof window === 'undefined') return;

  // 1. Smartsupp API Triggers (Handles all API versions & platforms)
  if (typeof window.smartsupp === 'function') {
    try {
      window.smartsupp('chat:show');
      window.smartsupp('chat:open');
      window.smartsupp('open');
    } catch (e) {
      console.warn('Smartsupp API trigger warning:', e);
    }
  }

  // 2. DOM Event & Iframe Fallback for Desktop Browsers
  try {
    const selectors = [
      '#smartsupp-widget',
      'iframe[id*="smartsupp"]',
      'iframe[name*="smartsupp"]',
      'iframe[title*="Smartsupp"]',
      'div[id*="smartsupp"]',
      'button[aria-label*="chat" i]',
      'button[aria-label*="smartsupp" i]'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector) as HTMLElement;
      if (el) {
        el.click();
        break;
      }
    }
  } catch (domErr) {
    // ignore
  }
};

