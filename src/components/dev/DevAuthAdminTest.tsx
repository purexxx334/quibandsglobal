import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config/api';

import { 
  ShieldCheck, 
  Terminal, 
  UserCheck, 
  Users, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Server, 
  Lock, 
  Key, 
  ChevronRight,
  Database,
  UserPlus,
  LogIn,
  LogOut,
  X
} from 'lucide-react';

interface DevAuthAdminTestProps {
  isOpen?: boolean;
  onClose?: () => void;
  hideFloatingButton?: boolean;
}

export const DevAuthAdminTest: React.FC<DevAuthAdminTestProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  hideFloatingButton = false,
}) => {
  const { user, session, profile, role, isConfigured, signUp, signIn, signOut, fetchProfileFromBackend } = useAuth();
  
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    if (controlledOnClose) {
      controlledOnClose();
    }
    setInternalIsOpen(false);
  };

  const [testEmail, setTestEmail] = useState('testuser@quibands.com');
  const [testPassword, setTestPassword] = useState('SecurePass123!');
  const [testFullName, setTestFullName] = useState('Test Trader');

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{ time: string; type: 'info' | 'success' | 'error'; message: string; details?: any }>>([]);
  const [adminUsersList, setAdminUsersList] = useState<any[]>([]);

  const addLog = (type: 'info' | 'success' | 'error', message: string, details?: any) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ time, type, message, details }, ...prev.slice(0, 29)]);
  };



  // 1. Test Backend Health Check
  const testHealthCheck = async () => {
    setLoadingAction('health');
    try {
      addLog('info', `Pinging ${API_BASE}/health...`);
      const res = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      if (res.ok) {
        addLog('success', `[200 OK] Server online: ${data.service}`, data);
      } else {
        addLog('error', `[${res.status}] Health check failed`, data);
      }
    } catch (err: any) {
      addLog('error', `Health check failed to connect. Is the backend server running on port 5000?`, err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Test User Registration
  const handleRegister = async () => {
    setLoadingAction('register');
    addLog('info', `Registering test user: ${testEmail}...`);
    try {
      const res = await signUp(testEmail, testPassword, testFullName);
      if (res.error) {
        addLog('error', `Registration error from Supabase Auth: ${res.error}`);
      } else {
        addLog('success', `User registered in Supabase Auth! User ID: ${res.user?.id}`, res.user);
        addLog('info', `Verifying database profile creation...`);
        if (session?.access_token) {
          const prof = await fetchProfileFromBackend(session.access_token);
          if (prof) {
            addLog('success', `Database profile confirmed via backend! Role: ${prof.role || 'user'}`);
          }
        }
      }
    } catch (err: any) {
      addLog('error', `Unexpected registration error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Test User Login
  const handleLogin = async () => {
    setLoadingAction('login');
    addLog('info', `Signing in with ${testEmail}...`);
    try {
      const res = await signIn(testEmail, testPassword);
      if (res.error) {
        addLog('error', `Login error: ${res.error}`);
      } else {
        addLog('success', `Login successful! Token generated.`);
        // Test profile fetch immediately
        await testGetProfile();
      }
    } catch (err: any) {
      addLog('error', `Unexpected sign in error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. Test GET /api/profile
  const testGetProfile = async () => {
    setLoadingAction('profile');
    if (!session?.access_token) {
      addLog('error', `Cannot test GET /api/profile: No active session. Please log in first.`);
      setLoadingAction(null);
      return;
    }

    try {
      addLog('info', `Executing GET ${API_BASE}/profile with Bearer Token...`);
      const res = await fetch(`${API_BASE}/profile`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addLog('success', `[200 OK] Backend Profile Verified!`, data.data);
      } else {
        addLog('error', `[${res.status}] GET /api/profile returned error`, data);
      }
    } catch (err: any) {
      addLog('error', `GET /api/profile fetch error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 5. Test GET /api/admin/users
  const testGetAdminUsers = async () => {
    setLoadingAction('admin-users');
    if (!session?.access_token) {
      addLog('error', `Cannot test GET /api/admin/users: No active session token.`);
      setLoadingAction(null);
      return;
    }

    try {
      addLog('info', `Executing GET ${API_BASE}/admin/users (Requires Admin Role)...`);
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setAdminUsersList(data.data.users || []);
        addLog('success', `[200 OK] Admin user list retrieved! Found ${data.data.total} user(s).`, data.data.users);
      } else if (res.status === 403) {
        addLog('error', `[403 Forbidden] Access Denied as expected for non-admin!`, data);
      } else {
        addLog('error', `[${res.status}] Admin users query failed`, data);
      }
    } catch (err: any) {
      addLog('error', `Admin users fetch error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      {/* Floating Bottom Left Trigger Button (Only rendered if hideFloatingButton is false) */}
      {!hideFloatingButton && (
        <div className="fixed bottom-6 left-6 z-40">
          <button
            onClick={() => setInternalIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-dark-900/95 hover:bg-dark-800 text-gold-400 border border-gold-500/40 shadow-xl backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Terminal className="w-4 h-4 text-gold-400" />
            <span className="text-xs font-mono font-bold">Phase 1-4 Test Console</span>
            {user && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>
      )}

      {/* Slide-over Diagnostic Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-dark-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-dark-900 border-l border-white/10 p-6 sm:p-8 flex flex-col h-full shadow-2xl overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                    Backend & Auth Integration Console
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Vertical Slice: Auth &rarr; Database &rarr; Backend API &rarr; Admin
                  </p>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>


            {/* Supabase & Backend Status Badges */}
            <div className="grid grid-cols-2 gap-3 mb-6 font-mono text-xs">
              <div className="p-3 rounded-xl bg-dark-850 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Supabase Config:</span>
                {isConfigured ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Set .env keys
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-dark-850 border border-white/5 flex items-center justify-between">
                <span className="text-slate-400">Backend Server:</span>
                <button
                  onClick={testHealthCheck}
                  disabled={loadingAction === 'health'}
                  className="text-gold-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === 'health' ? 'animate-spin' : ''}`} />
                  Test Health
                </button>
              </div>
            </div>

            {/* Current Session State */}
            <div className="p-4 rounded-xl bg-dark-850/80 border border-white/5 mb-6 space-y-2 font-mono text-xs">
              <div className="text-slate-300 font-bold uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-gold-400" /> Active Session State:
                </span>
                {user ? (
                  <button onClick={signOut} className="text-rose-400 hover:underline flex items-center gap-1">
                    <LogOut className="w-3 h-3" /> Sign Out
                  </button>
                ) : (
                  <span className="text-slate-500">Unauthenticated</span>
                )}
              </div>

              {user ? (
                <div className="space-y-1 text-slate-300 pt-1">
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Auth ID:</strong> <span className="text-slate-400 text-[11px]">{user.id}</span></div>
                  <div><strong>Database Role:</strong> <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${role === 'admin' ? 'bg-gold-500 text-dark-950' : 'bg-emerald-500/20 text-emerald-400'}`}>{role.toUpperCase()}</span></div>
                  {profile && (
                    <div><strong>Profile Name:</strong> {profile.full_name || 'N/A'} (Status: {profile.account_status})</div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400 text-[11px]">
                  No user is currently logged in. Use the test credentials below to register or sign in.
                </div>
              )}
            </div>

            {/* Test Action Controls */}
            <div className="space-y-4 mb-6">
              <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Interactive Vertical Verification Tests:
              </div>

              {/* Credential Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={testFullName}
                  onChange={(e) => setTestFullName(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-dark-850 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-gold-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-dark-850 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-gold-500"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-dark-850 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-gold-500"
                />
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={handleRegister}
                  disabled={loadingAction === 'register'}
                  className="px-3 py-2.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-gold-400 border border-gold-500/30 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>1. Register</span>
                </button>

                <button
                  onClick={handleLogin}
                  disabled={loadingAction === 'login'}
                  className="px-3 py-2.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>2. Sign In</span>
                </button>

                <button
                  onClick={testGetProfile}
                  disabled={loadingAction === 'profile'}
                  className="px-3 py-2.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-white border border-white/15 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>3. GET Profile</span>
                </button>

                <button
                  onClick={testGetAdminUsers}
                  disabled={loadingAction === 'admin-users'}
                  className="px-3 py-2.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-gold-400 border border-gold-500/40 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>4. GET Admin Users</span>
                </button>
              </div>
            </div>

            {/* Admin Users Table (When Retrieved) */}
            {adminUsersList.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-dark-850 border border-gold-500/30 font-mono text-xs">
                <div className="font-bold text-gold-400 mb-2 flex items-center justify-between">
                  <span>Registered Users in Database ({adminUsersList.length}):</span>
                  <span className="text-[10px] text-slate-400">GET /api/admin/users</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {adminUsersList.map((u, i) => (
                    <div key={i} className="p-2 rounded bg-dark-900 border border-white/5 flex items-center justify-between text-[11px]">
                      <div>
                        <div className="text-white font-bold">{u.email}</div>
                        <div className="text-slate-400">{u.full_name || 'No name'} &bull; Status: {u.account_status}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'admin' ? 'bg-gold-500 text-dark-950' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        {(u.role || 'user').toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Terminal Logs */}
            <div className="flex-grow flex flex-col min-h-[160px]">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-gold-400" /> Diagnostic Execution Log:
                </span>
                <button onClick={() => setLogs([])} className="text-[11px] text-slate-500 hover:text-slate-300">
                  Clear
                </button>
              </div>

              <div className="flex-grow p-3 rounded-xl bg-dark-950 border border-white/10 font-mono text-[11px] overflow-y-auto space-y-1.5">
                {logs.length === 0 ? (
                  <div className="text-slate-600 italic">No logs recorded yet. Click one of the test buttons above to begin.</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="leading-tight">
                      <span className="text-slate-600">[{log.time}] </span>
                      <span className={log.type === 'success' ? 'text-emerald-400' : log.type === 'error' ? 'text-rose-400 font-bold' : 'text-gold-300'}>
                        {log.message}
                      </span>
                      {log.details && (
                        <pre className="text-[10px] text-slate-400 bg-dark-900/60 p-1.5 rounded mt-1 overflow-x-auto">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
