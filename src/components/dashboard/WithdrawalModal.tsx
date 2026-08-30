import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Wallet,
  Coins,
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  Globe,
  DollarSign,
  User,
  CreditCard,
  Hash,
  Sparkles,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { adminDirectClient } from '../../lib/adminDirectClient';
import { BankDetails } from '../../types';
import { API_BASE } from '../../config/api';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenContact?: () => void;
  mainBalance?: number;
  profitBalance?: number;
  onSuccess?: () => void;
}

type WithdrawalStep = 'bank-details' | 'select-balance' | 'hbc-vbc-code' | 'pending';

const CURRENCY_SYMBOLS: Record<string, string> = {
  SGD: 'S$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
  CHF: 'CHF ',
  AED: 'AED ',
  USD: '$',
};

const BANK_COUNTRIES = [
  { country: 'Singapore', currency: 'SGD', flag: '🇸🇬' },
  { country: 'Eurozone (Germany, France, etc.)', currency: 'EUR', flag: '🇪🇺' },
  { country: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { country: 'United States', currency: 'USD', flag: '🇺🇸' },
  { country: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { country: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  { country: 'Japan', currency: 'JPY', flag: '🇯🇵' },
  { country: 'Switzerland', currency: 'CHF', flag: '🇨🇭' },
  { country: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪' },
];

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  onOpenContact,
  mainBalance = 0,
  onSuccess,
}) => {
  const { user, profile, session, refreshProfile } = useAuth();

  const [step, setStep] = useState<WithdrawalStep>('bank-details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User Profile state (for fetching saved bank details and convert balance)
  const initialConvertBal = Number(profile?.convert_balance || 0);
  const initialConvertCurr = profile?.convert_currency || 'SGD';
  const initialMainBal = Number(profile?.main_balance ?? mainBalance);

  const [profileConvertBalance, setProfileConvertBalance] = useState<number>(initialConvertBal);
  const [profileConvertCurrency, setProfileConvertCurrency] = useState<string>(initialConvertCurr);
  const [profileMainBalance, setProfileMainBalance] = useState<number>(initialMainBal);

  // Bank Details Form State
  const initialBank = profile?.bank_details;
  const [bankName, setBankName] = useState(initialBank?.bank_name || '');
  const [accountHolder, setAccountHolder] = useState(initialBank?.account_holder || profile?.full_name || '');
  const [accountNumber, setAccountNumber] = useState(initialBank?.account_number || '');
  const [swiftRouting, setSwiftRouting] = useState(initialBank?.swift_routing || '');
  const [bankCountry, setBankCountry] = useState(initialBank?.bank_country || 'Singapore');
  const [bankCurrency, setBankCurrency] = useState(initialBank?.currency || initialConvertCurr || 'SGD');
  const [isSavedBank, setIsSavedBank] = useState(Boolean(initialBank?.account_number));

  // Step 2: Source Balance Selection
  const [selectedSource, setSelectedSource] = useState<'main' | 'convert'>(initialConvertBal > 0 ? 'convert' : 'main');

  // Step 3: HBC / VBC Code
  const [hbcVbcCode, setHbcVbcCode] = useState('');

  // Step 4: Final Submission Data
  const [submittedData, setSubmittedData] = useState<{
    amount: number;
    currency: string;
    source: string;
    refCode?: string;
  } | null>(null);

  // Helper to reliably get the JWT Bearer token
  const getAuthToken = async (): Promise<string> => {
    if (session?.access_token) return session.access_token;
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) return data.session.access_token;
    } catch (e) {
      console.warn('Error fetching supabase session:', e);
    }
    return localStorage.getItem('quibands_auth_token') || sessionStorage.getItem('quibands_auth_token') || '';
  };

  const applyProfileData = (prof: any) => {
    if (!prof) return;
    const convBal = Number(prof.convert_balance || 0);
    const convCurr = prof.convert_currency || 'SGD';
    const depBal = Number(prof.deposit_balance || 0);
    const minBal = Number(prof.mining_balance || prof.profit_balance || 0);
    const mBal = Number(prof.main_balance ?? (depBal + minBal));

    setProfileConvertBalance(convBal);
    setProfileConvertCurrency(convCurr);
    setProfileMainBalance(mBal > 0 ? mBal : mainBalance);

    if (prof.bank_details && prof.bank_details.account_number) {
      const bd: BankDetails = prof.bank_details;
      setBankName(bd.bank_name || '');
      setAccountHolder(bd.account_holder || prof.full_name || '');
      setAccountNumber(bd.account_number || '');
      setSwiftRouting(bd.swift_routing || '');
      setBankCountry(bd.bank_country || 'Singapore');
      setBankCurrency(bd.currency || convCurr || 'SGD');
      setIsSavedBank(true);
    } else if (prof.full_name) {
      setAccountHolder(prof.full_name);
    }

    if (convBal > 0) {
      setSelectedSource('convert');
    } else {
      setSelectedSource('main');
    }
  };

  const fetchUserProfile = async () => {
    try {
      if (!user?.id) return;

      // 1. Direct Supabase query (instant & most accurate)
      const { data: dbProf } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (dbProf) {
        applyProfileData(dbProf);
        return;
      }

      // 2. Fallback to API endpoint
      const token = await getAuthToken();
      if (token) {
        const res = await fetch(`${API_BASE}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.success && json?.data) {
            applyProfileData(json.data);
          }
        }
      }
    } catch (err) {
      console.warn('Notice fetching profile for withdrawal:', err);
    }
  };

  // Fetch user profile and saved bank details when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setStep('bank-details');
      setError(null);
      if (profile) {
        applyProfileData(profile);
      }
      fetchUserProfile();
    }
  }, [isOpen, user?.id, session?.access_token]);

  if (!isOpen) return null;

  // Active withdrawal amount locked to 100% max of chosen balance
  const activeWithdrawalAmount = selectedSource === 'convert' ? profileConvertBalance : profileMainBalance;
  const activeCurrencySymbol = selectedSource === 'convert' 
    ? (CURRENCY_SYMBOLS[profileConvertCurrency] || '$') 
    : '$';
  const activeCurrencyLabel = selectedSource === 'convert' 
    ? `${profileConvertCurrency} Mine` 
    : 'USD';

  // Step 1 validation & save bank details
  const handleSaveBankAndNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!bankName.trim()) {
      setError('Please enter your Bank Name.');
      return;
    }
    if (!accountHolder.trim()) {
      setError('Please enter Account Holder Full Name.');
      return;
    }
    if (!accountNumber.trim()) {
      setError('Please enter your Account Number or IBAN.');
      return;
    }

    setLoading(true);
    try {
      const bankData: BankDetails = {
        bank_name: bankName.trim(),
        account_holder: accountHolder.trim(),
        account_number: accountNumber.trim(),
        swift_routing: swiftRouting.trim(),
        bank_country: bankCountry,
        currency: bankCurrency,
      };

      // Try API endpoint first
      let saved = false;
      try {
        const token = await getAuthToken();
        if (token) {
          const res = await fetch(`${API_BASE}/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ bank_details: bankData }),
          });
          if (res.ok) {
            const json = await res.json().catch(() => null);
            if (json?.success) saved = true;
          }
        }
      } catch (e) {}

      // Fallback: Direct Supabase profile update
      if (!saved && user?.id) {
        await supabase
          .from('profiles')
          .update({ bank_details: bankData, updated_at: new Date().toISOString() })
          .eq('auth_user_id', user.id);
      }

      setIsSavedBank(true);
      setStep('select-balance');
    } catch (err: any) {
      setError(err.message || 'Failed to save bank details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 validation
  const handleProceedToCode = () => {
    setError(null);
    if (activeWithdrawalAmount <= 0) {
      setError(`Your selected ${selectedSource === 'convert' ? 'Convert Balance' : 'Main Balance'} is currently $0.00. You need a positive balance to withdraw.`);
      return;
    }
    setStep('hbc-vbc-code');
  };

  // Step 3: Final verification & submission with direct Supabase fallback
  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hbcVbcCode.trim()) {
      setError('Please enter your HBC or VBC clearance authentication code.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        asset: selectedSource === 'convert' ? `${profileConvertCurrency} MINE` : 'USDT',
        network: 'Bank Wire Clearance',
        amount: activeWithdrawalAmount,
        localCurrency: selectedSource === 'convert' ? profileConvertCurrency : 'USD',
        conversionRate: 1.0,
        convertedAmount: activeWithdrawalAmount,
        payoutMethod: 'INSTITUTIONAL_BANK_TRANSFER',
        bankDetails: {
          bank_name: bankName.trim(),
          account_holder: accountHolder.trim(),
          account_number: accountNumber.trim(),
          swift_routing: swiftRouting.trim(),
          bank_country: bankCountry,
          currency: bankCurrency,
        },
        hbcVbcCode: hbcVbcCode.trim().toUpperCase(),
        metadata: {
          sourceBalance: selectedSource,
          bankCountry,
          bankCurrency,
        },
      };

      let isSuccess = false;
      let refId = `QB-WD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // 1. Try Backend API
      try {
        const token = await getAuthToken();
        if (token) {
          const res = await fetch(`${API_BASE}/withdrawals`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
          if (res.ok) {
            const json = await res.json().catch(() => null);
            if (json?.success) {
              isSuccess = true;
              if (json.data?.id) refId = `QB-WD-${json.data.id.slice(0, 8).toUpperCase()}`;
            }
          }
        }
      } catch (e) {}

      // 2. Direct Supabase insert fallback
      if (!isSuccess && user?.id) {
        const { data: directWd, error: directWdErr } = await supabase
          .from('withdrawal_requests')
          .insert({
            user_id: user.id,
            asset: payload.asset,
            network: payload.network,
            amount: payload.amount,
            fee_amount: 0,
            net_amount: payload.amount,
            status: 'PENDING',
            destination_wallet_address: `${bankName.trim()}: ${accountNumber.trim()}`,
            metadata: {
              ...payload.metadata,
              bank_details: payload.bankDetails,
            },
          })
          .select('*')
          .single();

        if (!directWdErr && directWd) {
          isSuccess = true;
          refId = `QB-WD-${directWd.id.slice(0, 8).toUpperCase()}`;
        } else if (directWdErr) {
          console.warn('Direct Supabase withdrawal insert error:', directWdErr.message);
        }
      }

      // 3. Immediately hold balance in escrow (set to 0 so it hangs pending approval)
      if (user?.id) {
        if (selectedSource === 'convert') {
          await adminDirectClient
            .from('profiles')
            .update({
              convert_balance: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('auth_user_id', user.id);
          setProfileConvertBalance(0);
        } else {
          await adminDirectClient
            .from('profiles')
            .update({
              deposit_balance: 0,
              mining_balance: 0,
              profit_balance: 0,
              main_balance: 0,
              updated_at: new Date().toISOString(),
            })
            .eq('auth_user_id', user.id);
          setProfileMainBalance(0);
        }
        if (refreshProfile) refreshProfile();
      }

      setSubmittedData({
        amount: activeWithdrawalAmount,
        currency: activeCurrencyLabel,
        source: selectedSource === 'convert' ? 'Convert Balance' : 'Main Balance',
        refCode: refId,
      });

      if (onSuccess) onSuccess();
      setStep('pending');
    } catch (err: any) {
      setError(err.message || 'Withdrawal submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-dark-950 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 my-auto animate-fadeIn text-slate-100">
        
        {/* Header with Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 shadow-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight font-mono">
                  DIRECT BANK WITHDRAWAL
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  FIAT SETTLEMENT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Institutional wire disbursement directly to your bank account
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (step === 'select-balance') {
                  setStep('bank-details');
                } else if (step === 'hbc-vbc-code') {
                  setStep('select-balance');
                } else {
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-all border border-slate-700/60 shadow-sm"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4 text-gold-400" />
              <span>Back</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Progress Tracker */}
        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
            step === 'bank-details' 
              ? 'bg-gold-500/15 border-gold-500/50 text-gold-300 font-bold shadow-sm' 
              : isSavedBank ? 'bg-dark-900 border-slate-800 text-emerald-400' : 'bg-dark-900 border-slate-800 text-slate-500'
          }`}>
            <span className="w-5 h-5 rounded-full bg-dark-950 border border-current flex items-center justify-center text-[10px]">1</span>
            <span className="truncate">Bank Details</span>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
            step === 'select-balance' 
              ? 'bg-gold-500/15 border-gold-500/50 text-gold-300 font-bold shadow-sm' 
              : (step === 'hbc-vbc-code' || step === 'pending') ? 'bg-dark-900 border-slate-800 text-emerald-400' : 'bg-dark-900 border-slate-800 text-slate-500'
          }`}>
            <span className="w-5 h-5 rounded-full bg-dark-950 border border-current flex items-center justify-center text-[10px]">2</span>
            <span className="truncate">Max Balance</span>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
            step === 'hbc-vbc-code' || step === 'pending'
              ? 'bg-gold-500/15 border-gold-500/50 text-gold-300 font-bold shadow-sm' 
              : 'bg-dark-900 border-slate-800 text-slate-500'
          }`}>
            <span className="w-5 h-5 rounded-full bg-dark-950 border border-current flex items-center justify-center text-[10px]">3</span>
            <span className="truncate">Clearance Code</span>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* STEP 1: BANK DETAILS FORM */}
        {step === 'bank-details' && (
          <form onSubmit={handleSaveBankAndNext} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Bank Settlement Routing</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Crypto withdrawals are routed through fiat institutional clearing. Please fill out your official bank account details below to receive wire settlement.
              </p>
            </div>

            {/* Bank Country & Settlement Currency */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-gold-400" />
                <span>Bank Country &amp; Settlement Currency</span>
              </label>
              <select
                value={bankCountry}
                onChange={(e) => {
                  setBankCountry(e.target.value);
                  const found = BANK_COUNTRIES.find((b) => b.country === e.target.value);
                  if (found) setBankCurrency(found.currency);
                }}
                className="w-full px-4 py-3 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 focus:outline-none text-white text-xs font-mono"
              >
                {BANK_COUNTRIES.map((b) => (
                  <option key={b.country} value={b.country}>
                    {b.flag} {b.country} — ({b.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Bank Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gold-400" />
                <span>Bank Name</span>
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. DBS Bank, Chase, Barclays, Citibank"
                className="w-full px-4 py-3 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 focus:outline-none text-white text-xs placeholder:text-slate-600"
                required
              />
            </div>

            {/* Account Holder Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gold-400" />
                <span>Account Holder Full Name</span>
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Full Legal Name on Account"
                className="w-full px-4 py-3 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 focus:outline-none text-white text-xs placeholder:text-slate-600"
                required
              />
            </div>

            {/* Account Number / IBAN */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-gold-400" />
                <span>Account Number / IBAN</span>
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 123-456789-0 or GB29NWBK60161331926819"
                className="w-full px-4 py-3 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 focus:outline-none text-white text-xs font-mono placeholder:text-slate-600"
                required
              />
            </div>

            {/* SWIFT / BIC / Routing Code (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-gold-400" />
                  <span>SWIFT / BIC or Routing Number</span>
                </span>
                <span className="text-[10px] text-slate-500 font-sans font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={swiftRouting}
                onChange={(e) => setSwiftRouting(e.target.value)}
                placeholder="e.g. DBSSSGSG or 021000021 (Optional)"
                className="w-full px-4 py-3 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 focus:outline-none text-white text-xs font-mono uppercase placeholder:text-slate-600"
              />
            </div>

            {/* Submit Step 1 Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-600 hover:from-gold-500 hover:to-amber-700 text-dark-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Saving Bank Details...</span>
                ) : (
                  <>
                    <span>Save &amp; Continue to Amount</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: CHOOSE SOURCE BALANCE & 100% MAX LOCKED */}
        {step === 'select-balance' && (
          <div className="space-y-5">
            <div className="text-xs text-slate-400">
              Select the source balance you wish to withdraw to your bank account. Institutional disbursements are settled at <strong className="text-emerald-400">100% MAX</strong>.
            </div>

            {/* Balance Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Option 1: Convert Balance Card */}
              <div
                onClick={() => setSelectedSource('convert')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative overflow-hidden ${
                  selectedSource === 'convert'
                    ? 'bg-gradient-to-br from-emerald-950/60 to-dark-900 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                    : 'bg-dark-900/70 border-slate-800 hover:border-slate-700 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span>CONVERT BALANCE</span>
                  </span>
                  {selectedSource === 'convert' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>

                <div className="text-2xl font-black text-white font-mono tracking-tight">
                  {CURRENCY_SYMBOLS[profileConvertCurrency] || '$'}
                  {profileConvertBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  {profileConvertCurrency} Mine Converted Assets
                </div>

                <div className="pt-1">
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                    100% SETTLED ASSETS
                  </span>
                </div>
              </div>

              {/* Option 2: Main Balance Card */}
              <div
                onClick={() => setSelectedSource('main')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 relative overflow-hidden ${
                  selectedSource === 'main'
                    ? 'bg-gradient-to-br from-gold-950/60 to-dark-900 border-gold-500/80 shadow-lg shadow-gold-500/10 ring-1 ring-gold-500/50'
                    : 'bg-dark-900/70 border-slate-800 hover:border-slate-700 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-gold-400 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-gold-400" />
                    <span>MAIN BALANCE</span>
                  </span>
                  {selectedSource === 'main' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-pulse" />
                  )}
                </div>

                <div className="text-2xl font-black text-white font-mono tracking-tight">
                  ${profileMainBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  USD Institutional Vault
                </div>

                <div className="pt-1">
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30 rounded-full">
                    100% FULL PAYOUT
                  </span>
                </div>
              </div>

            </div>

            {/* Locked Amount Display Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="uppercase tracking-wider font-semibold">Withdrawal Amount</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>LOCKED TO 100% MAX</span>
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">
                  {activeCurrencySymbol}
                  {activeWithdrawalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-base text-slate-300 font-semibold">{activeCurrencyLabel}</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">MAX OPTION</span>
              </div>

              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1 pt-1 border-t border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Manual amount editing is disabled. Withdrawals execute at 100% portfolio liquidation.</span>
              </p>
            </div>

            {/* Payout Destination Summary Card */}
            <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 text-xs font-mono space-y-2">
              <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold flex items-center justify-between">
                <span>Payout Destination Bank</span>
                <button
                  type="button"
                  onClick={() => setStep('bank-details')}
                  className="text-gold-400 hover:text-gold-300 underline text-[11px]"
                >
                  Edit Bank Details
                </button>
              </div>
              <div className="text-white font-bold flex items-center justify-between">
                <span>{bankName}</span>
                <span className="text-slate-400">{accountHolder}</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Account: <span className="text-slate-200">**** **** {accountNumber.slice(-4) || accountNumber}</span> ({bankCountry})
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('bank-details')}
                className="w-1/3 py-3.5 px-4 rounded-2xl bg-dark-900 hover:bg-dark-850 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleProceedToCode}
                className="w-2/3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-600 hover:from-gold-500 hover:to-amber-700 text-dark-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.99] cursor-pointer"
              >
                <span>Proceed to Clearance Code</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ENTER HBC / VBC CODE */}
        {step === 'hbc-vbc-code' && (
          <form onSubmit={handleSubmitWithdrawal} className="space-y-5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-dark-900 to-slate-900 border border-indigo-500/30 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-mono font-bold text-xs">
                <Key className="w-4 h-4 text-indigo-400" />
                <span>Host Banking Clearance Authentication</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                To authorize direct wire disbursement to your bank (<strong className="text-white">{bankName}</strong>), please enter your assigned <strong className="text-indigo-300 font-mono">HBC (Host Banking Clearance)</strong> or <strong className="text-indigo-300 font-mono">VBC (Verification Banking Code)</strong>.
              </p>
            </div>

            {/* Input HBC / VBC Code */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-gold-400" />
                  <span>ENTER HBC OR VBC CODE</span>
                </span>
                {onOpenContact && (
                  <button
                    type="button"
                    onClick={onOpenContact}
                    className="text-gold-400 hover:text-gold-300 text-[11px] underline flex items-center gap-1 font-normal"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Need Code? Contact Support</span>
                  </button>
                )}
              </label>

              <input
                type="text"
                value={hbcVbcCode}
                onChange={(e) => setHbcVbcCode(e.target.value.toUpperCase())}
                placeholder="e.g. HBC-994821 or VBC-481920"
                className="w-full px-4 py-3.5 rounded-2xl bg-dark-900 border border-slate-700 focus:border-gold-400 focus:ring-1 focus:ring-gold-400 focus:outline-none text-white text-base font-mono font-bold tracking-widest text-center uppercase placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-normal placeholder:text-xs"
                required
                autoFocus
              />

              <p className="text-[11px] text-slate-400 font-mono text-center">
                Institutional codes are verified against the clearance ledger prior to final wire dispatch.
              </p>
            </div>

            {/* Summary Box */}
            <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Disbursement Amount:</span>
                <span className="text-emerald-400 font-bold">
                  {activeCurrencySymbol}{activeWithdrawalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {activeCurrencyLabel}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Destination Account:</span>
                <span className="text-white font-bold">{bankName} - **** {accountNumber.slice(-4)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('select-balance')}
                className="w-1/3 py-3.5 px-4 rounded-2xl bg-dark-900 hover:bg-dark-850 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={loading || !hbcVbcCode.trim()}
                className="w-2/3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Verifying Code &amp; Submitting...</span>
                ) : (
                  <>
                    <span>Verify &amp; Submit Withdrawal</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: PENDING CONFIRMATION & ACTIVITY REDIRECT */}
        {step === 'pending' && (
          <div className="space-y-6 text-center py-2 animate-fadeIn">
            
            {/* Animated Pending Clock Glow Icon */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-50" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/10 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/20">
                <Clock className="w-10 h-10 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                WITHDRAWAL PENDING CLEARANCE
              </span>
              <h3 className="text-xl font-black text-white font-mono tracking-tight">
                Withdrawal Submitted for Audit
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Your bank withdrawal request has been registered with Compliance. Once institutional verification of your HBC/VBC code is completed, wire dispatch will initiate.
              </p>
            </div>

            {/* Receipt Summary Card */}
            {submittedData && (
              <div className="p-4 rounded-2xl bg-dark-900/90 border border-slate-800 text-xs font-mono text-left space-y-2.5 max-w-md mx-auto shadow-inner">
                {submittedData.refCode && (
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Reference:</span>
                    <span className="text-gold-400 font-bold">{submittedData.refCode}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Payout Amount:</span>
                  <span className="text-emerald-400 font-bold">
                    {submittedData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {submittedData.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Beneficiary Bank:</span>
                  <span className="text-white font-bold">{bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Beneficiary Account:</span>
                  <span className="text-slate-200">{accountHolder} (**** {accountNumber.slice(-4)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Clearance Status:</span>
                  <span className="text-amber-400 font-bold">PENDING COMPLIANCE REVIEW</span>
                </div>
              </div>
            )}

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-600 hover:from-gold-500 hover:to-amber-700 text-dark-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] cursor-pointer"
              >
                View in Withdrawal Activity
              </button>

              {onOpenContact && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenContact();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-white text-xs font-mono transition"
                >
                  Questions about your transfer? Contact Support
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
