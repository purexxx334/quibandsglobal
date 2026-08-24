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

  // Option B: Continuous Synchronization of Logged-in Trader Profile Data
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
        'User ID': user.id
      };

      window._smartsupp = window._smartsupp || {};
      window._smartsupp.name = userName;
      window._smartsupp.email = userEmail;
      window._smartsupp.variables = syncVars;

      if (typeof window.smartsupp === 'function') {
        try {
          window.smartsupp('name', userName);
          window.smartsupp('email', userEmail);
          window.smartsupp('variables', syncVars);
        } catch (e) {
          console.warn('Smartsupp sync warning:', e);
        }
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

  // Smartsupp's native launcher renders directly without any DOM blocking overlay
  return null;
};

// Global helper to open native Smartsupp chat directly (e.g. from navbar or Contact Support buttons)
export const openSmartsuppChat = () => {
  if (typeof window === 'undefined') return;

  if (typeof window.smartsupp === 'function') {
    try {
      window.smartsupp('chat:show');
      window.smartsupp('chat:open');
    } catch (e) {
      console.warn('Smartsupp open warning:', e);
    }
  }
};
