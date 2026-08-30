import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowDownCircle, 
  ArrowUpCircle,
  Wallet, 
  TrendingUp, 
  Cpu, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Bell, 
  RefreshCw, 
  Copy, 
  Check, 
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Activity,
  Layers,
  Zap,
  Server,
  Award,
  AlertTriangle,
  Info,
  DollarSign,
  Pickaxe,
  Radio,
  Flame,
  CheckCircle,
  User,
  FileCheck,
  ShieldAlert,
  Edit3,
  Gift,
  Coins,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DepositRequest, WithdrawalRequest, UserNotification, Transaction, UserProfile } from '../../types';
import { supabase } from '../../lib/supabase';
import { adminDirectClient } from '../../lib/adminDirectClient';
import { EditProfileModal } from './EditProfileModal';
import { KycModal } from './KycModal';
import { ReferralModal } from './ReferralModal';
import { API_BASE } from '../../config/api';


interface UserDashboardProps {
  onOpenDeposit: () => void;
  onOpenConvert?: (deposit?: number, profit?: number, main?: number) => void;
  onOpenWithdrawal?: (deposit?: number, profit?: number, main?: number) => void;
  onOpenCalculator?: () => void;
  onOpenAdmin?: () => void;
}


const SUPPORTED_COINS = [
  { symbol: 'USDT', name: 'Tether USD', network: 'TRC20 / ERC20', price: 1.00, icon: '₮', color: 'from-emerald-400 to-teal-600', textCol: 'text-emerald-400' },
  { symbol: 'BTC', name: 'Bitcoin', network: 'Native Core', price: 64200.00, icon: '₿', color: 'from-amber-400 to-amber-600', textCol: 'text-amber-400' },
  { symbol: 'ETH', name: 'Ethereum', network: 'ERC20 Proof-of-Stake', price: 3450.00, icon: 'Ξ', color: 'from-indigo-400 to-purple-600', textCol: 'text-indigo-400' },
  { symbol: 'SOL', name: 'Solana', network: 'Solana High-Throughput', price: 148.50, icon: '◎', color: 'from-purple-400 to-fuchsia-600', textCol: 'text-purple-400' },
  { symbol: 'LTC', name: 'Litecoin', network: 'Scrypt Native', price: 82.30, icon: 'Ł', color: 'from-blue-400 to-cyan-600', textCol: 'text-blue-400' },
  { symbol: 'BNB', name: 'BNB Chain', network: 'BEP20 EVM', price: 580.00, icon: '⬡', color: 'from-yellow-400 to-amber-500', textCol: 'text-yellow-400' },
];

export const UserDashboard: React.FC<UserDashboardProps> = ({ onOpenDeposit, onOpenConvert, onOpenWithdrawal, onOpenCalculator, onOpenAdmin }) => {
  const { user, profile, session, role, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'transactions' | 'deposits' | 'withdrawals' | 'notifications'>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [wallets, setWallets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [freshProfile, setFreshProfile] = useState<UserProfile | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getHeaders = async () => {
    const token = session?.access_token || (await supabase.auth.getSession()).data?.session?.access_token;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    };
  };

  // Fetch Dashboard Data
  // Fetch Dashboard Data with high-performance parallel execution
  const fetchDashboardData = async () => {
    try {
      const headers = await getHeaders();

      // Parallelize all endpoint calls for instant sub-second loading
      const [profRes, depRes, wdRes, txRes, notifRes, walletRes] = await Promise.allSettled([
        fetch(`${API_BASE}/profile`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/deposits`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/withdrawals`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/transactions/me`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/notifications`, { headers }).then(r => r.json()).catch(() => null),
        user?.id ? supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      // 1. Process Profile
      if (profRes.status === 'fulfilled' && profRes.value?.success && profRes.value?.data) {
        const p = profRes.value.data;
        setFreshProfile(p);
      } else if (user?.id) {
        const { data: directProf } = await supabase.from('profiles').select('*').eq('auth_user_id', user.id).maybeSingle();
        if (directProf) {
          setFreshProfile(directProf as any);
        }
      }

      // 2. Process Deposits
      if (depRes.status === 'fulfilled' && depRes.value?.success && Array.isArray(depRes.value?.data)) {
        setDeposits(depRes.value.data);
        const balanceMap: Record<string, number> = {};
        depRes.value.data.forEach((d: DepositRequest) => {
          if (d.status === 'APPROVED') {
            const asset = d.asset.toUpperCase();
            balanceMap[asset] = (balanceMap[asset] || 0) + Number(d.amount);
          }
        });
        setWallets(balanceMap);
      }

      // 3. Process Wallets
      if (walletRes.status === 'fulfilled' && walletRes.value?.data) {
        setWallets((prev) => ({
          ...prev,
          USDT: Number(walletRes.value.data.balance || 0),
        }));
      }

      // 4. Process Withdrawals
      if (wdRes.status === 'fulfilled' && wdRes.value?.success && Array.isArray(wdRes.value?.data)) {
        setWithdrawals(wdRes.value.data);
      }

      // 5. Process Transactions & Synthesize Comprehensive History
      let txList: any[] = [];
      if (txRes.status === 'fulfilled' && txRes.value?.success && Array.isArray(txRes.value?.data)) {
        txList = txRes.value.data;
      }

      // If backend transactions list is empty, query Supabase directly and combine all transactions (deposits, withdrawals, conversions, direct ledger)
      if (user?.id) {
        const [directTxs, directDeps, directWds, directConvs] = await Promise.all([
          supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('deposit_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('withdrawal_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('conversion_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        ]);

        const combinedMap = new Map<string, any>();

        // Add direct ledger transactions
        (directTxs.data || []).forEach((t: any) => combinedMap.set(String(t.id), t));
        txList.forEach((t: any) => combinedMap.set(String(t.id), t));

        // Add deposits to transaction history
        (directDeps.data || []).forEach((d: any) => {
          const key = `dep_${d.id}`;
          if (!combinedMap.has(key)) {
            combinedMap.set(key, {
              id: key,
              user_id: d.user_id,
              type: 'deposit',
              amount: Number(d.amount),
              asset: d.asset || 'USDT',
              status: d.status.toLowerCase(),
              memo: `Deposit via ${d.network || d.asset} (${d.status})`,
              created_at: d.created_at,
            });
          }
        });

        // Add withdrawals to transaction history
        (directWds.data || []).forEach((w: any) => {
          const key = `wd_${w.id}`;
          if (!combinedMap.has(key)) {
            combinedMap.set(key, {
              id: key,
              user_id: w.user_id,
              type: 'withdrawal',
              amount: Number(w.amount),
              asset: w.asset || 'USDT',
              status: w.status.toLowerCase(),
              memo: `Withdrawal to ${w.bank_details?.bank_name || 'Bank Wire'} (${w.status})`,
              created_at: w.created_at,
            });
          }
        });

        // Add conversions to transaction history
        (directConvs.data || []).forEach((c: any) => {
          const key = `conv_${c.id}`;
          if (!combinedMap.has(key)) {
            combinedMap.set(key, {
              id: key,
              user_id: c.user_id,
              type: 'conversion',
              amount: Number(c.from_amount || c.amount || 0),
              asset: c.from_currency || 'USDT',
              status: c.status.toLowerCase(),
              memo: `Converted ${c.from_amount || 0} ${c.from_currency || 'USDT'} to ${c.to_amount || 0} ${c.to_currency || 'SGD'} (${c.status})`,
              created_at: c.created_at,
            });
          }
        });

        const sortedCombined = Array.from(combinedMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setTransactions(sortedCombined);
        if (directDeps.data && directDeps.data.length > 0) setDeposits(directDeps.data);
        if (directWds.data && directWds.data.length > 0) setWithdrawals(directWds.data);
      } else if (txList.length > 0) {
        setTransactions(txList);
      }

      // 6. Process Notifications
      if (notifRes.status === 'fulfilled' && notifRes.value?.success && Array.isArray(notifRes.value?.data)) {
        setNotifications(notifRes.value.data);
      }

    } catch (err: any) {
      console.warn('Dashboard fetch error:', err.message);
    }
  };


  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 8000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Financial Balances Calculation directly from database & profile state
  const activeProfile = freshProfile || profile;
  const approvedDepositsTotal = deposits.filter((d) => d.status === 'APPROVED').reduce((sum, d) => sum + Number(d.amount || 0), 0);
  
  // Deposit Balance: strictly respect database state from admin edits or verified deposits
  const depositBalanceUsd = activeProfile?.deposit_balance !== undefined && activeProfile?.deposit_balance !== null
    ? Number(activeProfile.deposit_balance)
    : approvedDepositsTotal;

  // Profit Balance: strictly respect database state from admin edits
  const profitBalanceUsd = Number(
    activeProfile?.profit_balance !== undefined && activeProfile?.profit_balance !== null
      ? activeProfile.profit_balance
      : (activeProfile?.mining_balance !== undefined && activeProfile?.mining_balance !== null
          ? activeProfile.mining_balance
          : 0)
  );

  // Main balance: strictly respect database state from admin edits, or sum of deposit + profit
  const mainBalanceUsd = activeProfile?.main_balance !== undefined && activeProfile?.main_balance !== null
    ? Number(activeProfile.main_balance)
    : Number((depositBalanceUsd + profitBalanceUsd).toFixed(2));

  const convertBalance = Number(activeProfile?.convert_balance || 0);
  const convertCurrency = activeProfile?.convert_currency || 'SGD';
  const receiveLimitUsd = Number(activeProfile?.receive_limit || 9000.00);
  const accountTier = activeProfile?.account_tier || 'BASIC';

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. Header with Account Status & Quick Actions */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-dark-900 via-dark-950 to-slate-900 border border-gold-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-gold-400 px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/30">
                Institutional Portfolio
              </span>
              <span className="text-xs font-mono font-bold text-slate-300 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Tier: <strong className="text-amber-300">{accountTier}</strong></span>
              </span>
              <span className="text-xs font-mono text-slate-400 px-2.5 py-1 rounded-full bg-dark-950/80 border border-white/5 hidden sm:inline-block">
                Limit: <strong className="text-slate-200">${receiveLimitUsd.toLocaleString()}</strong>
              </span>

              {/* KYC Status Badge Button */}
              <button
                onClick={() => setKycModalOpen(true)}
                className={`text-xs font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 transition-all transform active:scale-95 ${
                  profile?.kyc_status === 'VERIFIED'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                    : profile?.kyc_status === 'PENDING'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 animate-pulse'
                    : profile?.kyc_status === 'REJECTED'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:border-gold-400/40'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  KYC: <strong className={
                    profile?.kyc_status === 'VERIFIED' ? 'text-emerald-300' :
                    profile?.kyc_status === 'PENDING' ? 'text-amber-300' :
                    profile?.kyc_status === 'REJECTED' ? 'text-rose-300' : 'text-slate-300'
                  }>{profile?.kyc_status || 'NOT SUBMITTED'}</strong>
                </span>
              </button>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-500">{activeProfile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'Investor')}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Real-time multi-asset vault balances, institutional portfolio management, and audited financial ledger records.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {(role === 'admin' || user?.email?.toLowerCase() === 'admin@quibandsglobal.com') && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-gold-400 text-dark-950 hover:brightness-110 font-black text-xs font-mono transition-all flex items-center gap-2 shadow-xl shadow-amber-500/30 transform active:scale-95 animate-pulse cursor-pointer border-2 border-amber-300"
                title="Launch SuperAdmin Institutional Control Hub"
              >
                <ShieldCheck className="w-4 h-4 text-dark-950" />
                <span>ADMIN CONTROL HUB</span>
              </button>
            )}

            <button
              onClick={() => setEditProfileOpen(true)}
              className="px-4 py-3 rounded-2xl bg-dark-950 border border-slate-700 hover:border-gold-400 text-slate-200 hover:text-white font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4 text-gold-400" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => setKycModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-dark-950 border border-slate-700 hover:border-emerald-500 text-slate-200 hover:text-white font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Identity / KYC</span>
            </button>

            <button
              onClick={() => setReferralModalOpen(true)}
              className="px-4 py-3 rounded-2xl bg-dark-950 border border-slate-700 hover:border-gold-400 text-gold-300 hover:text-gold-200 font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <Gift className="w-4 h-4 text-gold-400" />
              <span>Affiliate & Earn</span>
            </button>

            <button
              onClick={onOpenDeposit}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-600 hover:from-gold-500 hover:to-amber-700 text-dark-950 font-bold text-xs shadow-gold transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer"
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Deposit Assets</span>
            </button>

            {onOpenConvert && (
              <button
                onClick={() => onOpenConvert(depositBalanceUsd, profitBalanceUsd, mainBalanceUsd)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>Convert</span>
              </button>
            )}

            {onOpenWithdrawal && (
              <button
                type="button"
                onClick={() => onOpenWithdrawal(depositBalanceUsd, profitBalanceUsd, mainBalanceUsd)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-dark-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer"
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>Withdraw</span>
              </button>
            )}

            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-3 rounded-2xl bg-dark-950 border border-slate-700 text-slate-300 hover:text-white hover:border-gold-400/50 transition-colors"
              title="Refresh Portfolio"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-gold-400' : ''}`} />
            </button>
          </div>

        </div>
      </div>

      {/* 2. Financial Balances Section (Deposit Balance, Profit Balance, and Main Balance [Capital + Profit]) */}
      <div className="space-y-3">
        
        {/* Compact, Sleek 3-Card Portfolio Balance Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          
          {/* 2.1 Deposit Balance (Capital Deposited) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/95 border border-cyan-500/30 hover:border-cyan-400/60 transition-all relative overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
                  <ArrowDownCircle className="w-4 h-4 text-cyan-400" />
                  <span>Deposit Balance</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                  CAPITAL
                </span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  ${depositBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
                  <span>Active Capital Deposited</span>
                </div>
              </div>
            </div>

            {/* Admin Remark for Deposit Balance */}
            {profile?.deposit_remark && (
              <div className="mt-2.5 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[11px] text-cyan-300 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-cyan-400" />
                <span className="leading-tight">{profile.deposit_remark}</span>
              </div>
            )}
          </div>

          {/* 2.2 Profit Balance (Yield / Profit) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/95 border border-emerald-500/30 hover:border-emerald-400/60 transition-all relative overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Profit Balance</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                  PROFIT / YIELD
                </span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tracking-tight">
                  ${profitBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-emerald-400/80 flex items-center gap-1.5 mt-1 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Accumulated Profit &amp; Yield</span>
                </div>
              </div>
            </div>

            {/* Admin Remark for Profit Balance */}
            {(profile?.profit_remark || profile?.mining_remark) && (
              <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-400" />
                <span className="leading-tight">{profile?.profit_remark || profile?.mining_remark}</span>
              </div>
            )}
          </div>

          {/* 2.3 Main Balance (Total: Capital + Profit) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-dark-900 via-dark-950 to-slate-900 border border-gold-500/40 hover:border-gold-400/70 transition-all relative overflow-hidden shadow-xl flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-gold-400 font-mono flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-gold-400" />
                  <span>Main Balance</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gold-400/10 text-gold-300 border border-gold-400/30 font-bold">
                  TOTAL
                </span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight bg-gradient-to-r from-gold-200 via-white to-gold-300 bg-clip-text text-transparent">
                  ${mainBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-gold-400/90 flex flex-wrap items-center gap-1.5 mt-1 font-mono">
                  <span className="text-cyan-300 font-bold">${depositBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} Capital</span>
                  <span className="text-slate-500">+</span>
                  <span className="text-emerald-400 font-bold">${profitBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} Profit</span>
                </div>
              </div>
            </div>

            {/* Admin Remark for Main Balance */}
            {profile?.balance_remark && (
              <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
                <span className="leading-tight">{profile.balance_remark}</span>
              </div>
            )}
          </div>

        </div>

        {/* 2.4 Convert Balance Card (Rendered Sleekly & Compactly) */}
        {(convertBalance > 0 || profile?.convert_balance !== undefined) && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-dark-900/90 to-teal-950/30 border border-emerald-500/25 hover:border-emerald-500/40 transition-all relative overflow-hidden shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold uppercase tracking-wider text-emerald-400 text-xs font-mono">Convert Balance</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {convertCurrency} Mine
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono tracking-tight mt-0.5">
                  {convertCurrency === 'SGD' ? 'S$' :
                   convertCurrency === 'EUR' ? '€' :
                   convertCurrency === 'GBP' ? '£' :
                   convertCurrency === 'CAD' ? 'CA$' :
                   convertCurrency === 'AUD' ? 'A$' :
                   convertCurrency === 'JPY' ? '¥' :
                   convertCurrency === 'CHF' ? 'CHF ' :
                   convertCurrency === 'AED' ? 'AED ' : '$'
                  }{convertBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-semibold text-emerald-400">{convertCurrency} Assets</span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 sm:self-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Settled Conversion Assets</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. ACTIVITY & TRANSACTION LEDGER SECTION */}
      <div className="rounded-3xl bg-dark-900/90 border border-slate-800 overflow-hidden shadow-xl">
        
        {/* Tab Selector Header */}
        <div className="flex border-b border-slate-800 px-6 bg-dark-950/60 overflow-x-auto">
          
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-4 text-xs font-bold font-mono border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'transactions'
                ? 'border-gold-400 text-gold-400 bg-gold-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 text-gold-400" />
            Transaction History ({transactions.length})
          </button>

          <button
            onClick={() => setActiveTab('deposits')}
            className={`py-4 px-4 text-xs font-bold font-mono border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'deposits'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            Deposit Requests ({deposits.length})
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`py-4 px-4 text-xs font-bold font-mono border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'withdrawals'
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            Withdrawal Activity ({withdrawals.length})
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-4 px-4 text-xs font-bold font-mono border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'border-indigo-400 text-indigo-400 bg-indigo-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            Security & Alerts ({notifications.length})
          </button>
        </div>


        {/* Tab Contents */}
        <div className="p-6">

          {/* TAB 0: TRANSACTIONS HISTORY & REASON LEDGER */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl space-y-3">
                  <Activity className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-medium text-slate-400">No transactions recorded yet.</p>
                  <p className="text-xs text-slate-500 font-mono">All account credits, yields, and adjustments with designated reasons appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-slate-800 text-slate-400 bg-dark-950/40">
                      <tr>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Transaction Type</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Reason / Description</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 text-slate-400">{new Date(t.created_at).toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              t.type === 'mining_yield' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                              t.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              t.type === 'withdrawal' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              t.type === 'conversion' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                              'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                            }`}>
                              {t.type === 'mining_yield' ? 'MINING YIELD' :
                               t.type === 'deposit' ? 'DEPOSIT' :
                               t.type === 'withdrawal' ? 'WITHDRAWAL' :
                               t.type === 'conversion' ? 'CONVERSION' :
                               'ACCOUNT CREDIT'}
                            </span>
                          </td>
                          <td className={`py-3 px-4 font-bold text-sm ${
                            t.type === 'withdrawal' ? 'text-rose-400' :
                            t.type === 'conversion' ? 'text-purple-300' : 'text-emerald-400'
                          }`}>
                            {t.type === 'withdrawal' ? '-' : '+'}${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-slate-400">{t.asset}</span>
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-200">
                            <span className="font-semibold text-white">{t.memo || t.admin_notes || 'Account Transaction'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit ${
                              t.status === 'confirmed' || t.status === 'approved' || t.status === 'completed' || t.status === 'settled'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : t.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                              {t.status === 'confirmed' || t.status === 'approved' || t.status === 'completed' || t.status === 'settled' ? <Check className="w-3 h-3" /> :
                               t.status === 'pending' ? <Clock className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              <span className="uppercase">{t.status || 'COMPLETED'}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: DEPOSIT REQUESTS */}
          {activeTab === 'deposits' && (
            <div className="space-y-4">
              {deposits.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl space-y-3">
                  <ArrowDownCircle className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-medium text-slate-400">No deposit records yet.</p>
                  <button
                    onClick={onOpenDeposit}
                    className="px-5 py-2.5 rounded-xl bg-gold-400/10 hover:bg-gold-400/20 text-gold-400 text-xs font-bold transition-colors"
                  >
                    Create First Deposit
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-slate-800 text-slate-400 bg-dark-950/40">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Asset</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Transaction Hash</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {deposits.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 text-slate-400">{new Date(d.created_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-bold text-white">{d.asset} ({d.network})</td>
                          <td className="py-3 px-4 font-bold text-emerald-400">+{Number(d.amount).toFixed(4)}</td>
                          <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{d.transaction_hash}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              d.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                              d.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WITHDRAWALS ACTIVITY */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              {withdrawals.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl space-y-3">
                  <ArrowUpCircle className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-medium text-slate-400">No withdrawal records found.</p>
                  {onOpenWithdrawal && (
                    <button
                      onClick={() => onOpenWithdrawal(mainBalanceUsd, profitBalanceUsd)}
                      className="px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-colors"
                    >
                      Start Withdrawal
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((w) => {
                    const isApproved = w.status === 'APPROVED';
                    const isRejected = w.status === 'REJECTED';
                    const isPending = w.status === 'PENDING' || (!isApproved && !isRejected);

                    return (
                      <div key={w.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl border ${
                              isApproved ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                              isRejected ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                              'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}>
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-base font-mono">
                                  {w.amount} {w.asset}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-dark-900 border border-slate-800 text-slate-300">
                                  Direct Bank Wire
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-mono">
                                {w.created_at ? new Date(w.created_at).toLocaleString() : 'Just now'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {isPending && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center space-x-1.5 animate-pulse">
                                <Clock className="w-3.5 h-3.5" />
                                <span>PENDING CLEARANCE</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>APPROVED &amp; DISPATCHED</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center space-x-1.5">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>REJECTED &amp; REFUNDED</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Beneficiary Details & Clearance Code Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300 p-3 bg-dark-900/80 rounded-xl border border-slate-900 font-mono">
                          <div>
                            <span className="text-slate-500 block text-[10px]">BENEFICIARY BANK:</span>
                            <span className="font-bold text-white">
                              {w.bank_details?.bank_name || (w.destination_wallet_address ? w.destination_wallet_address.split(':')[0] : 'Direct Bank Wire')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">ACCOUNT / BENEFICIARY:</span>
                            <span className="text-slate-200 truncate block">
                              {w.bank_details?.account_holder ? `${w.bank_details.account_holder} (${w.bank_details.account_number || ''})` : (w.destination_wallet_address || 'Bank Transfer')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">HBC / VBC CODE:</span>
                            <span className="font-bold text-gold-400">
                              {w.hbc_vbc_code || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Admin Remark / Rejection Reason banner */}
                        {w.rejection_reason && (
                          <div className={`p-2.5 rounded-xl border text-xs font-mono flex items-start gap-2 ${
                            isApproved 
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                              : isRejected 
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          }`}>
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                              <strong className="uppercase font-bold tracking-wider">Compliance Remark: </strong>
                              <span>{w.rejection_reason}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs font-mono">No security notifications recorded.</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                    <Bell className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{n.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-600 font-mono mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Investor Profile Modal */}
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        onProfileUpdated={fetchDashboardData}
      />

      {/* KYC Verification & Document Upload Modal */}
      <KycModal
        isOpen={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        onKycUpdated={fetchDashboardData}
      />

      {/* Referral & Affiliate Program Modal */}
      <ReferralModal
        isOpen={referralModalOpen}
        onClose={() => setReferralModalOpen(false)}
      />

    </div>

  );
};
