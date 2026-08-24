import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

declare global {
  interface Window {
    _smartsupp?: any;
    smartsupp?: any;
    SmartSupp?: any;
  }
}

interface SmartsuppChatProps {
  adminHubOpen?: boolean;
}

/**
 * Waits for window.smartsupp to become available (max ~10s), then calls the callback.
 * This ensures we don't try to interact with Smartsupp before it is fully loaded.
 */
function whenSmartsuppReady(callback: () => void, maxWaitMs = 10000) {
  const start = Date.now();
  const check = () => {
    if (typeof window !== 'undefined' && typeof window.smartsupp === 'function') {
      callback();
    } else if (Date.now() - start < maxWaitMs) {
      setTimeout(check, 250);
    }
  };
  check();
}

export const SmartsuppChat: React.FC<SmartsuppChatProps> = ({ adminHubOpen = false }) => {
  const { user, profile } = useAuth();

  // Option B: Sync logged-in trader info to Smartsupp dashboard
  useEffect(() => {
    if (typeof window === 'undefined') return;

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
        'User ID': user.id,
      };

      // Pre-set on _smartsupp config object so even early loads pick up the data
      window._smartsupp = window._smartsupp || {};
      window._smartsupp.name = userName;
      window._smartsupp.email = userEmail;
      window._smartsupp.variables = syncVars;

      // Once Smartsupp API is ready, push the live identity
      whenSmartsuppReady(() => {
        try {
          window.smartsupp('name', userName);
          window.smartsupp('email', userEmail);
          window.smartsupp('variables', syncVars);
        } catch (e) {
          console.warn('Smartsupp identity sync warning:', e);
        }
      });
    }
  }, [user, profile]);

  // Show / hide widget based on Admin Control Hub state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    whenSmartsuppReady(() => {
      try {
        if (adminHubOpen) {
          window.smartsupp('chat:hide');
        } else {
          window.smartsupp('chat:show');
        }
      } catch (e) {
        // suppress
      }
    });
  }, [adminHubOpen]);

  // This component renders nothing — Smartsupp renders its own native floating widget
  return null;
};

/**
 * Global helper to programmatically open the Smartsupp floating chat.
 * Waits for Smartsupp to be ready before opening so it never fails silently.
 */
export const openSmartsuppChat = () => {
  if (typeof window === 'undefined') return;

  whenSmartsuppReady(() => {
    try {
      window.smartsupp('chat:show');
      window.smartsupp('chat:open');
    } catch (e) {
      console.warn('Smartsupp open warning:', e);
    }
  });
};
