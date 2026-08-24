import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

import { UserProfile } from '../types';
import { API_BASE as API_BASE_URL } from '../config/api';

export type { UserProfile };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: 'user' | 'admin' | 'moderator';
  loading: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string, fullName: string, referralCode?: string) => Promise<{ error?: string; user?: User | null }>;
  signIn: (email: string, password: string) => Promise<{ error?: string; user?: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  fetchProfileFromBackend: (token?: string) => Promise<UserProfile | null>;
  refreshProfile: (token?: string) => Promise<UserProfile | null>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'user' | 'admin' | 'moderator'>('user');
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Fetch user profile from the Node.js / Express backend
  const fetchProfileFromBackend = async (authToken?: string): Promise<UserProfile | null> => {
    const token = authToken || session?.access_token;
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn(`[Backend Profile] Status ${response.status}: Failed to retrieve profile.`);
        return null;
      }

      const result = await response.json();
      if (result.success && result.data) {
        setProfile(result.data);
        if (result.data.role === 'admin' || result.data.email?.toLowerCase() === 'admin@quibandsglobal.com') {
          setRole('admin');
        } else if (result.data.role) {
          setRole(result.data.role);
        }
        return result.data;
      }
      return null;
    } catch (err) {
      console.warn('[Backend Profile API Error]:', err);
      return null;
    }
  };


  // 2. Initialize and listen to Supabase Auth state changes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Supabase getSession error:', error.message);
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);

          if (initialSession?.access_token) {
            await fetchProfileFromBackend(initialSession.access_token);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // Listen for auth events (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user?.email?.toLowerCase() === 'admin@quibandsglobal.com') {
          setRole('admin');
        }

        if (currentSession?.access_token) {
          const fetchedProfile = await fetchProfileFromBackend(currentSession.access_token);
          // Sync authenticated visitor directly with Smartsupp
          if (typeof window !== 'undefined' && (window as any).smartsupp) {
            try {
              (window as any).smartsupp('name', fetchedProfile?.full_name || currentSession.user?.email || 'Valued Trader');
              (window as any).smartsupp('email', currentSession.user?.email || '');
              (window as any).smartsupp('variables', {
                userId: { value: currentSession.user?.id, label: 'User ID' },
                fullName: { value: fetchedProfile?.full_name || 'N/A', label: 'Full Name' },
                email: { value: currentSession.user?.email || 'N/A', label: 'Email' },
                accountTier: { value: fetchedProfile?.kyc_status || 'Standard', label: 'KYC Tier' },
                activeBalance: { value: `$${fetchedProfile?.total_balance || 0}`, label: 'Total Balance' }
              });
            } catch(e) {}
          }
        } else {
          setProfile(null);
          setRole('user');
        }


        if (event === 'SIGNED_IN' && currentSession?.user) {
          sendTelemetry({
            userId: currentSession.user.id,
            userEmail: currentSession.user.email,
            eventType: 'login_success',
            status: 'success',
            authMethod: 'supabase_session_active',
          });
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Helper: Dispatch telemetry to backend and ensure record persistence
  const sendTelemetry = async (payload: {
    userId?: string | null;
    userEmail?: string | null;
    eventType: string;
    status: 'success' | 'failed' | 'warning';
    authMethod?: string;
    details?: Record<string, any>;
  }) => {
    try {
      const body = {
        ...payload,
        authMethod: payload.authMethod || 'email_password',
      };
      const res = await fetch(`${API_BASE_URL}/security/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.warn(`[Telemetry Warning] POST /api/security/telemetry responded with status ${res.status}`);
      }
    } catch (e) {
      console.warn('[Telemetry Error]: Failed to send telemetry event:', e);
    }
  };

  // 3. User Sign Up
  const signUp = async (email: string, password: string, fullName: string, referralCode?: string) => {
    try {
      // 1. Call Backend Registration (Auto-confirms user in auth.users and sets temp_password)
      const registerRes = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          fullName: fullName.trim(),
          referralCode: referralCode?.trim() || undefined,
        }),
      });

      const registerJson = await registerRes.json();
      if (!registerRes.ok || !registerJson.success) {
        await sendTelemetry({
          userEmail: email,
          eventType: 'registration_failed',
          status: 'failed',
          authMethod: 'email_password',
          details: { error: registerJson.error || 'Registration rejected' },
        });
        return { error: registerJson.error || 'Registration failed' };
      }

      // 2. Immediately Log In with active session (Zero email confirmation wait)
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInErr) {
        return { error: signInErr.message };
      }

      if (signInData.session) {
        setSession(signInData.session);
        setUser(signInData.user);
        await fetchProfileFromBackend(signInData.session.access_token);
      }

      return { user: signInData.user };
    } catch (err: any) {
      await sendTelemetry({
        userEmail: email,
        eventType: 'registration_failed',
        status: 'failed',
        authMethod: 'email_password',
        details: { error: err.message },
      });
      return { error: err.message || 'Registration failed' };
    }
  };

  // 4. User Sign In (Every login creates a telemetry record)
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await sendTelemetry({
          userEmail: email,
          eventType: 'login_failed',
          status: 'failed',
          authMethod: 'email_password',
          details: { error: error.message },
        });
        return { error: error.message };
      }

      // Record successful login telemetry
      await sendTelemetry({
        userId: data.user.id,
        userEmail: data.user.email,
        eventType: 'login_success',
        status: 'success',
        authMethod: 'email_password',
        details: { provider: 'supabase_auth' },
      });

      if (data.session?.access_token) {
        await fetchProfileFromBackend(data.session.access_token);
      }

      return { user: data.user };
    } catch (err: any) {
      await sendTelemetry({
        userEmail: email,
        eventType: 'login_failed',
        status: 'failed',
        authMethod: 'email_password',
        details: { error: err.message },
      });
      return { error: err.message || 'Login failed' };
    }
  };

  // 5. User Sign Out
  const signOut = async () => {
    try {
      if (user) {
        await sendTelemetry({
          userId: user.id,
          userEmail: user.email,
          eventType: 'logout',
          status: 'success',
          authMethod: 'session_revocation',
        });
      }
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole('user');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // 6. Reset Password
  const resetPassword = async (email: string) => {
    try {
      await sendTelemetry({
        userEmail: email,
        eventType: 'password_reset_request',
        status: 'success',
        authMethod: 'email_recovery',
      });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Password reset request failed' };
    }
  };

  // 7. Refresh Session manually
  const refreshSession = async () => {
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
    if (refreshedSession) {
      setSession(refreshedSession);
      setUser(refreshedSession.user);
      await fetchProfileFromBackend(refreshedSession.access_token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        isConfigured: isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        resetPassword,
        fetchProfileFromBackend,
        refreshProfile: fetchProfileFromBackend,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
