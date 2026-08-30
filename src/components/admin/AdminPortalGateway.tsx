import React, { useState } from 'react';
import { Shield, Lock, KeyRound, AlertCircle, Loader2, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminPortalGatewayProps {
  onSuccess: () => void;
  onExit: () => void;
}

export const AdminPortalGateway: React.FC<AdminPortalGatewayProps> = ({ onSuccess, onExit }) => {
  const { signIn, user, role } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both admin email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await signIn(email.trim(), password);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isCurrentNonAdmin = user && role !== 'admin' && role !== 'moderator' && user.email?.toLowerCase() !== 'admin@quibandsglobal.com';

  return (
    <div className="min-h-screen w-full bg-dark-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Exit Navigation */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-900/90 hover:bg-dark-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 transition-all text-xs font-mono"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Main Website</span>
        </button>
      </div>

      {/* Portal Container */}
      <div className="w-full max-w-md bg-dark-900/90 backdrop-blur-2xl border border-gold-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500/20 to-amber-500/10 border border-gold-500/40 text-gold-400 shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>ADMIN CONTROL PORTAL</span>
            </h1>
            <p className="text-xs text-gold-400/80 font-mono mt-1 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              <span>Restricted Access Gateway</span>
            </p>
          </div>
        </div>

        {/* Access Denied Warning if logged in with non-admin */}
        {isCurrentNonAdmin && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <div>
              <div className="font-bold">Access Restricted</div>
              <div className="text-[11px] text-rose-400/90 mt-0.5">
                Current account ({user?.email}) does not have administrative clearance. Please authenticate with admin credentials.
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="text-[11px] font-medium leading-relaxed">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-semibold">
              Admin Identifier / Email
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@quibandsglobal.com"
                className="w-full px-4 py-3 rounded-xl bg-dark-950/80 border border-slate-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-white text-sm placeholder-slate-600 transition-all font-mono outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-semibold">
              Administrative Security Key / Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl bg-dark-950/80 border border-slate-800 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-white text-sm placeholder-slate-600 transition-all font-mono outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-gold-500 via-amber-500 to-gold-600 hover:from-gold-400 hover:to-amber-400 text-dark-950 font-black font-mono text-sm tracking-wider uppercase shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Security Clearance...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Authenticate & Access Hub</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Footer Notice */}
        <div className="pt-2 text-center text-[11px] text-slate-500 font-mono space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>256-Bit Encrypted Supervisory Session</span>
          </div>
          <div>All access attempts and authorization changes are immutably logged.</div>
        </div>

      </div>
    </div>
  );
};
