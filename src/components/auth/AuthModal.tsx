import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  KeyRound, 
  AlertCircle,
  Smartphone,
  ArrowLeft,
  Home
} from 'lucide-react';
import { AuthMode } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: AuthMode;
  onClose: () => void;
  onSuccessAuth: (userEmail: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  initialMode, 
  onClose,
  onSuccessAuth
}) => {
  const { user, signUp, signIn, resetPassword, isConfigured } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    agreeTerms: true
  });

  // Auto-close modal if user is already logged in
  React.useEffect(() => {
    if (isOpen && user) {
      onClose();
    }
  }, [isOpen, user, onClose]);

  // Sync mode when initialMode prop changes & capture URL ?ref= param
  React.useEffect(() => {
    setMode(initialMode);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref') || params.get('referral');
      if (refParam) {
        setFormData((prev) => ({ ...prev, referralCode: refParam.toUpperCase() }));
      }
    } catch (e) {
      // url search param ignore
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'register') {
      if (!formData.fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!formData.email || !formData.email.includes('@')) {
        setErrorMsg('Please provide a valid email address.');
        return;
      }
      if (!formData.phoneNumber || formData.phoneNumber.trim().length < 6) {
        setErrorMsg('Mobile phone number is required for account verification and sign-in.');
        return;
      }
      if (formData.password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await signUp(
          formData.email, 
          formData.password, 
          formData.fullName, 
          formData.referralCode,
          formData.phoneNumber
        );
        if (res.error) {
          setErrorMsg(res.error);
          setLoading(false);
          return;
        }

        onSuccessAuth(formData.email || formData.phoneNumber);
        onClose();
      } else if (mode === 'login') {

        const res = await signIn(formData.email, formData.password);
        if (res.error) {
          setErrorMsg(res.error);
          setLoading(false);
          return;
        }
        onSuccessAuth(formData.email);
        onClose();
      } else if (mode === 'forgot_password') {
        const res = await resetPassword(formData.email);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSuccessMsg(`A cryptographic password reset link has been dispatched to ${formData.email}. Please check your inbox or spam folder.`);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication operation failed.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-dark-950/85 backdrop-blur-md overflow-y-auto overscroll-contain animate-fadeIn">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl bg-dark-900 border border-white/10 p-5 sm:p-8 shadow-2xl overflow-hidden my-auto sm:my-8">

        
        {/* Top Action Header with Back & Close */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-300 hover:text-white border border-white/5 text-xs font-mono transition-all"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4 text-gold-400" />
            <span>Back to Home</span>
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white border border-white/5 transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Title & Tab Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-700 p-[1px] mx-auto mb-3 shadow-gold-sm">
            <div className="w-full h-full bg-dark-900 rounded-[15px] flex items-center justify-center">
              <Lock className="w-5 h-5 text-gold-400" />
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-white font-['Outfit']">
            {mode === 'login' ? 'Sign In to Quibands' : 'Open Mining Account'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' 
              ? 'Enter your mobile number or email to access your mining ledger.' 
              : 'Join the premier institutional crypto mining infrastructure.'}
          </p>

          {/* Mode Switch Tabs */}
          <div className="mt-5 grid grid-cols-2 p-1 rounded-xl bg-dark-850 border border-white/5">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login' 
                  ? 'bg-dark-800 text-gold-400 shadow-sm border border-gold-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register' 
                  ? 'bg-dark-800 text-gold-400 shadow-sm border border-gold-500/20' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Error / Success Banners */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Jonathan Vance"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-850 border border-white/10 text-white text-sm focus:border-gold-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
              {mode === 'login' ? 'Email Address or Mobile Number' : (
                <span>Email Address <span className="text-gold-500">*</span></span>
              )}
            </label>
            <div className="relative">
              {mode === 'login' ? (
                <div className="absolute left-3.5 top-3 flex items-center gap-1 text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-[10px] text-slate-600">/</span>
                  <Smartphone className="w-3.5 h-3.5 text-gold-500/80" />
                </div>
              ) : (
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              )}
              <input
                type={mode === 'login' ? 'text' : 'email'}
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={mode === 'login' ? 'e.g. name@example.com or +1 234 567 8900' : 'name@example.com'}
                className={`w-full pr-4 py-2.5 rounded-xl bg-dark-850 border border-white/10 text-white text-sm focus:border-gold-500 focus:outline-none ${
                  mode === 'login' ? 'pl-14' : 'pl-10'
                }`}
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider">
                  Mobile Number <span className="text-gold-500">*</span>
                </label>
                <span className="text-[10px] text-amber-400 font-mono">Sign in via Mobile</span>
              </div>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="e.g. +1 555 123 4567"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-850 border border-white/10 text-white text-sm focus:border-gold-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-dark-850 border border-white/10 text-white text-sm focus:border-gold-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-850 border border-white/10 text-white text-sm focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-slate-300 uppercase tracking-wider">
                    Referral Code (Optional)
                  </label>
                  <span className="text-[10px] text-gold-400 font-mono">10% Lifetime Commission</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={formData.referralCode}
                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. QUIB-849201"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-850 border border-white/10 text-gold-300 font-mono text-sm uppercase focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="gold-gradient-btn w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-gold-sm disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating with Ledger...</span>
              ) : (
                <>
                  <span>
                    {mode === 'login' ? 'Sign In to Dashboard' : 'Create Account & Begin Mining'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>


        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Argon2id Salted Passwords & Zero Plaintext Storage</span>
        </div>

      </div>
    </div>
  );
};
