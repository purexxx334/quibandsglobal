import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { adminDirectClient } from '../lib/adminDirectClient';

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
  signUp: (email: string, password: string, fullName: string, referralCode?: string, phoneNumber?: string) => Promise<{ error?: string; user?: User | null }>;
  signIn: (identifier: string, password: string) => Promise<{ error?: string; user?: User | null }>;
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

  // 1. Fetch user profile from the Node.js / Express backend with direct Supabase fallback
  const fetchProfileFromBackend = async (authToken?: string): Promise<UserProfile | null> => {
    const token = authToken || session?.access_token;

    try {
      if (token) {
        const response = await fetch(`${API_BASE_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
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
        }
      }
    } catch (err) {
      console.warn('[Backend Profile API Notice]:', err);
    }

    // Direct Supabase Fallback for instant client-side resiliency
    try {
      const currentUid = user?.id || session?.user?.id;
      if (currentUid) {
        const { data: directProf } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_user_id', currentUid)
          .maybeSingle();

        if (directProf) {
          setProfile(directProf as any);
          if (directProf.role === 'admin' || directProf.email?.toLowerCase() === 'admin@quibandsglobal.com') {
            setRole('admin');
          }
          return directProf as any;
        }
      }
    } catch (directErr) {
      console.warn('[Direct Supabase Profile Fallback]:', directErr);
    }

    return null;
  };


  // Helper: check user role directly from Supabase user_roles table
  const checkUserRoleDirectly = async (userId: string, email?: string) => {
    if (email && (email.toLowerCase() === 'admin@quibandsglobal.com' || email.toLowerCase().startsWith('admin@'))) {
      setRole('admin');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      if (!error && data && data.length > 0) {
        if (data.some((r: any) => r.role === 'admin')) {
          setRole('admin');
        } else if (data.some((r: any) => r.role === 'moderator')) {
          setRole('moderator');
        }
      }
    } catch (e) {
      console.warn('Direct role check fallback notice:', e);
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

        if (mounted && initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);

          // Direct role check for instant UI reactivity
          await checkUserRoleDirectly(initialSession.user.id, initialSession.user.email);

          if (initialSession.access_token) {
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

        if (currentSession?.user) {
          await checkUserRoleDirectly(currentSession.user.id, currentSession.user.email);
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
                phoneNumber: { value: fetchedProfile?.phone_number || 'N/A', label: 'Phone Number' },
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

  // 3. User Sign Up (Supports Email & Mobile Number)
  const signUp = async (
    email: string, 
    password: string, 
    fullName: string, 
    referralCode?: string,
    phoneNumber?: string
  ) => {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPhone = phoneNumber ? phoneNumber.trim() : '';
    const cleanFullName = fullName.trim();
    const cleanReferral = referralCode?.trim() || undefined;

    try {
      // 1. Call Backend Registration (Auto-confirms user in auth.users and sets temp_password)
      let registerSuccess = false;
      let registeredEmail = cleanEmail;

      try {
        const registerRes = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail || undefined,
            phoneNumber: cleanPhone || undefined,
            password,
            fullName: cleanFullName,
            referralCode: cleanReferral,
          }),
        });

        let registerJson: any = null;
        try {
          registerJson = await registerRes.json();
        } catch (jsonErr) {
          // If response is not JSON
        }

        if (registerRes.ok && registerJson?.success) {
          registerSuccess = true;
          if (registerJson.data?.email) {
            registeredEmail = registerJson.data.email;
          }
        } else if (registerJson?.error) {
          await sendTelemetry({
            userEmail: cleanEmail || cleanPhone,
            eventType: 'registration_failed',
            status: 'failed',
            authMethod: cleanPhone ? 'mobile_or_email' : 'email_password',
            details: { error: registerJson.error },
          });
          return { error: registerJson.error };
        }
      } catch (backendErr: any) {
        console.warn('Backend /auth/register request failed, attempting direct Supabase signup fallback...', backendErr);
      }

      const targetAuthEmail = registeredEmail || (cleanEmail.includes('@') ? cleanEmail : `${cleanPhone.replace(/[^0-9]/g, '')}@quibands.user`);

      // 2. Log in user with active session
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: targetAuthEmail,
        password,
      });

      if (!signInErr && signInData.session) {
        setSession(signInData.session);
        setUser(signInData.user);
        // Sync password for administrative support
        try {
          adminDirectClient
            .from('profiles')
            .update({
              temp_password: password,
              updated_at: new Date().toISOString(),
            })
            .eq('auth_user_id', signInData.user.id);
        } catch (e) {}
        await fetchProfileFromBackend(signInData.session.access_token);
        return { user: signInData.user };
      }

      // 3. Fallback: If signIn was not possible (e.g. backend offline and user not created yet in auth.users), invoke direct Supabase signUp
      if (!registerSuccess && signInErr) {
        const { data: directSignUpData, error: directSignUpErr } = await supabase.auth.signUp({
          email: targetAuthEmail,
          password,
          options: {
            data: {
              full_name: cleanFullName,
              phone_number: cleanPhone,
              referral_code: cleanReferral,
              temp_password: password,
            },
          },
        });

        if (directSignUpErr) {
          return { error: directSignUpErr.message };
        }

        if (directSignUpData.user) {
          try {
            await adminDirectClient
              .from('profiles')
              .upsert({
                auth_user_id: directSignUpData.user.id,
                email: targetAuthEmail,
                full_name: cleanFullName || targetAuthEmail.split('@')[0],
                phone_number: cleanPhone || null,
                temp_password: password,
                account_status: 'active',
                updated_at: new Date().toISOString(),
              }, { onConflict: 'auth_user_id' });
          } catch (e) {}
        }

        if (directSignUpData.session) {
          setSession(directSignUpData.session);
          setUser(directSignUpData.user);
          await fetchProfileFromBackend(directSignUpData.session.access_token);
        }

        return { user: directSignUpData.user };
      }

      if (signInErr) {
        return { error: signInErr.message };
      }

      return { user: signInData?.user };
    } catch (err: any) {
      await sendTelemetry({
        userEmail: cleanEmail || cleanPhone,
        eventType: 'registration_failed',
        status: 'failed',
        authMethod: cleanPhone ? 'mobile_or_email' : 'email_password',
        details: { error: err.message },
      });
      return { error: err.message || 'Registration failed' };
    }
  };

  // 4. User Sign In (Supports Email or Mobile Number)
  const signIn = async (identifier: string, password: string) => {
    try {
      const cleanIdentifier = identifier.trim();
      let targetEmail = cleanIdentifier.toLowerCase();

      // If user inputs a mobile phone number (no '@' symbol)
      if (!cleanIdentifier.includes('@')) {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/resolve-identifier`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: cleanIdentifier }),
          });
          const json = await res.json();
          if (json.success && json.data?.email) {
            targetEmail = json.data.email;
          } else {
            const digits = cleanIdentifier.replace(/[^0-9]/g, '');
            if (digits) targetEmail = `${digits}@quibands.user`;
          }
        } catch (e) {
          const digits = cleanIdentifier.replace(/[^0-9]/g, '');
          if (digits) targetEmail = `${digits}@quibands.user`;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (error) {
        let friendlyErr = error.message;
        if (error.message?.toLowerCase().includes('invalid login credentials')) {
          friendlyErr = 'Invalid credentials. Please verify your email / mobile number and password.';
        }
        sendTelemetry({
          userEmail: targetEmail,
          eventType: 'login_failed',
          status: 'failed',
          authMethod: cleanIdentifier.includes('@') ? 'email_password' : 'mobile_password',
          details: { error: error.message, identifier: cleanIdentifier },
        });
        return { error: friendlyErr };
      }

      // Immediately set user and session state
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
      }

      // Record successful login telemetry in background
      sendTelemetry({
        userId: data.user.id,
        userEmail: data.user.email,
        eventType: 'login_success',
        status: 'success',
        authMethod: cleanIdentifier.includes('@') ? 'email_password' : 'mobile_password',
        details: { provider: 'supabase_auth', identifier: cleanIdentifier },
      });

      // Sync password to profile so Admin dashboard can always see latest working password
      try {
        adminDirectClient
          .from('profiles')
          .update({
            temp_password: password,
            updated_at: new Date().toISOString(),
          })
          .eq('auth_user_id', data.user.id);
      } catch (e) {}

      if (data.session?.access_token) {
        fetchProfileFromBackend(data.session.access_token);
      }

      return { user: data.user };
    } catch (err: any) {
      sendTelemetry({
        userEmail: identifier,
        eventType: 'login_failed',
        status: 'failed',
        authMethod: 'auth_attempt',
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
