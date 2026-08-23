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
  Gift
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DepositRequest, WithdrawalRequest, UserNotification, Transaction } from '../../types';
import { supabase } from '../../lib/supabase';
import { EditProfileModal } from './EditProfileModal';
import { KycModal } from './KycModal';
import { ReferralModal } from './ReferralModal';





const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface UserDashboardProps {
  onOpenDeposit: () => void;
  onOpenWithdrawal?: () => void;
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

export const UserDashboard: React.FC<UserDashboardProps> = ({ onOpenDeposit, onOpenWithdrawal, onOpenCalculator, onOpenAdmin }) => {
  const { user, profile, session, role, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'transactions' | 'deposits' | 'withdrawals' | 'notifications'>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [wallets, setWallets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);


  // Live Miner Simulation & Ticking State (5 Hours Cycle = 18,000s, $5.00 Target Yield)

  const SESSION_TOTAL_SECONDS = 18000; // 5 hours
  const SESSION_TARGET_YIELD = 5.00; // $5.00 per session
  const [liveMiningBalance, setLiveMiningBalance] = useState<number>(0);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState<number>(() => {
    const saved = localStorage.getItem('quibands_miner_seconds_left');
    return saved ? Math.min(SESSION_TOTAL_SECONDS, Math.max(1, parseInt(saved, 10))) : SESSION_TOTAL_SECONDS;
  });
  const [sessionTotalSeconds] = useState<number>(SESSION_TOTAL_SECONDS);
  const [sessionBlockNumber, setSessionBlockNumber] = useState<number>(() => {
    const saved = localStorage.getItem('quibands_miner_block_num');
    return saved ? parseInt(saved, 10) : 884219;
  });
  const [sessionYieldEarned, setSessionYieldEarned] = useState<number>(() => {
    const saved = localStorage.getItem('quibands_miner_yield_earned');
    return saved ? parseFloat(saved) : 0;
  });
  const [sessionStatus, setSessionStatus] = useState<'ACTIVE' | 'SOLVING' | 'NEW_CYCLE'>('ACTIVE');
  const [hashrateSpeed, setHashrateSpeed] = useState<number>(142.84);
  const [activeNonce, setActiveNonce] = useState<string>('0x7F8B2A914C');
  const [sharesAccepted, setSharesAccepted] = useState<number>(248);
  const [justTicked, setJustTicked] = useState<boolean>(false);
  const [solvedNotification, setSolvedNotification] = useState<string | null>(null);

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
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();

      // Refresh Auth Context Profile for updated remarks/balances
      if (refreshProfile) refreshProfile();

      // 1. Fetch User Deposits
      const depRes = await fetch(`${API_BASE}/deposits`, { headers });
      const depJson = await depRes.json();
      if (depJson.success && Array.isArray(depJson.data)) {
        setDeposits(depJson.data);

        // Calculate balances from approved deposits
        const balanceMap: Record<string, number> = {};
        depJson.data.forEach((d: DepositRequest) => {
          if (d.status === 'APPROVED') {
            const asset = d.asset.toUpperCase();
            balanceMap[asset] = (balanceMap[asset] || 0) + Number(d.amount);
          }
        });
        setWallets(balanceMap);
      }

      // 2. Fetch User Actual Wallets for Main/Mining/Profit balances
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id || '')
        .maybeSingle();

      if (walletData) {
        setWallets((prev) => ({
          ...prev,
          USDT: Number(walletData.balance || 0),
        }));
        // Initialize mining balance if not set
        const baseMining = Number(walletData.mining_balance || profile?.mining_balance || 0);
        setLiveMiningBalance((prev) => (prev > 0 ? prev : baseMining));
      } else if (profile?.mining_balance) {
        setLiveMiningBalance((prev) => (prev > 0 ? prev : Number(profile.mining_balance)));
      }

      // 3. Fetch User Withdrawals
      const wdRes = await fetch(`${API_BASE}/withdrawals`, { headers });
      const wdJson = await wdRes.json();
      if (wdJson.success && Array.isArray(wdJson.data)) {
        setWithdrawals(wdJson.data);
      }

      // 4. Fetch User Transactions Ledger
      try {
        const txRes = await fetch(`${API_BASE}/transactions/me`, { headers });
        const txJson = await txRes.json();
        if (txJson.success && Array.isArray(txJson.data)) {
          setTransactions(txJson.data);
        }
      } catch (txErr) {
        console.warn('Transactions fetch error:', txErr);
      }

      // 5. Fetch User Notifications
      const notifRes = await fetch(`${API_BASE}/notifications`, { headers });
      const notifJson = await notifRes.json();
      if (notifJson.success && Array.isArray(notifJson.data)) {
        setNotifications(notifJson.data);
      }

    } catch (err: any) {
      console.warn('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  // Sync initial mining balance from profile once loaded
  useEffect(() => {
    if (profile?.mining_balance !== undefined) {
      const pBalance = Number(profile.mining_balance || 0);
      setLiveMiningBalance((prev) => (prev > 0 ? prev : pBalance));
    }
  }, [profile?.mining_balance]);

  // =========================================================================
  // LIVE MINER ENGINE: 5-Hour Session ($5.00 Yield Rate) & Auto-Restarting Cycle
  // =========================================================================
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Calculate per-second increment: $5.00 / 18,000s = ~$0.00027777...
      // With micro-fluctuation around 0.0002777 (+/- 0.000020)
      const basePerSec = SESSION_TARGET_YIELD / SESSION_TOTAL_SECONDS; // 0.0002777...
      const microVariance = (Math.random() - 0.5) * 0.000030;
      const microIncrement = +(basePerSec + microVariance).toFixed(7);

      // Increment live balance and session yield
      setLiveMiningBalance((prev) => {
        const next = +(prev + microIncrement).toFixed(6);
        return next;
      });

      setSessionYieldEarned((prev) => {
        const nextYield = +(prev + microIncrement).toFixed(5);
        localStorage.setItem('quibands_miner_yield_earned', String(nextYield));
        return nextYield;
      });

      // Trigger flash animation
      setJustTicked(true);
      setTimeout(() => setJustTicked(false), 500);

      // 2. Fluctuate Hashrate slightly (142.1 ~ 143.9 TH/s)
      const newHash = +(142.5 + Math.random() * 1.4).toFixed(2);
      setHashrateSpeed(newHash);

      // 3. Generate randomized cryptographic nonce
      const hexChars = '0123456789ABCDEF';
      let nonceStr = '0x';
      for (let i = 0; i < 8; i++) {
        nonceStr += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
      }
      setActiveNonce(nonceStr);

      // 4. Session Countdown & Automatic Restart Logic
      setSessionSecondsLeft((prevSec) => {
        if (prevSec <= 1) {
          // 5-Hour Session Completed! Finalize block, record $5.00, and auto-restart next 5h session
          setSessionStatus('SOLVING');
          setSharesAccepted((s) => s + 1);
          const nextBlock = sessionBlockNumber + 1;
          setSessionBlockNumber(nextBlock);
          localStorage.setItem('quibands_miner_block_num', String(nextBlock));

          setSolvedNotification(`5-Hour Mining Session Complete! Block #${sessionBlockNumber} Verified: +$5.00 USDT yield credited. Next 5h session started.`);
          setTimeout(() => setSolvedNotification(null), 5000);

          // Reset session counters and restart active session immediately
          setSessionYieldEarned(0);
          localStorage.setItem('quibands_miner_yield_earned', '0');
          setSessionStatus('ACTIVE');
          localStorage.setItem('quibands_miner_seconds_left', String(SESSION_TOTAL_SECONDS));
          return SESSION_TOTAL_SECONDS; // reset back to 5 hours (18,000s)
        }
        const nextSec = prevSec - 1;
        if (nextSec % 10 === 0) {
          localStorage.setItem('quibands_miner_seconds_left', String(nextSec));
        }
        return nextSec;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [SESSION_TOTAL_SECONDS, SESSION_TARGET_YIELD, sessionBlockNumber]);


  // Financial Balances Calculation
  const mainBalanceUsd = Number(profile?.main_balance !== undefined ? profile.main_balance : (wallets['USDT'] || 0));
  const miningBalanceUsd = liveMiningBalance > 0 ? liveMiningBalance : Number(profile?.mining_balance || 0);
  const profitBalanceUsd = Number(profile?.profit_balance !== undefined ? profile.profit_balance : 0);
  const receiveLimitUsd = Number(profile?.receive_limit || 9000.00);
  const accountTier = profile?.account_tier || 'BASIC';

  // Calculate session percentage
  const sessionPercent = Math.min(100, Math.max(0, Math.round(((sessionTotalSeconds - sessionSecondsLeft) / sessionTotalSeconds) * 100)));

  // Format time remaining as hh:mm:ss
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


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
              Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-500">{profile?.full_name || 'Investor'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Real-time multi-asset vault balances, enterprise cloud mining cluster telemetry, and audited financial ledger records.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
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

            {(role === 'admin' || user?.email?.toLowerCase() === 'admin@quibandsglobal.com') && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-gold-500/20 border border-gold-400/50 hover:border-gold-400 text-gold-300 hover:text-white font-bold text-xs transition-all flex items-center gap-2 animate-pulse shadow-gold-sm"
              >
                <ShieldAlert className="w-4 h-4 text-gold-400" />
                <span>ADMIN CONTROL HUB</span>
              </button>
            )}



            <button
              onClick={onOpenDeposit}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-gold-400 to-amber-600 hover:from-gold-500 hover:to-amber-700 text-dark-950 font-bold text-xs shadow-gold transition-all flex items-center gap-2 transform active:scale-95"
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Deposit Assets</span>
            </button>

            {onOpenWithdrawal && (
              <button
                onClick={onOpenWithdrawal}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 transform active:scale-95"
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

      {/* 2. Three Main Financial Balances Grid (Main, Mining, Profit) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 2.1 Main Vault Balance */}
        <div className="p-6 rounded-2xl bg-dark-900/90 border border-slate-800 space-y-3 hover:border-slate-700 transition-all relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Main Vault Balance</span>
            <div className="p-2.5 rounded-xl bg-gold-400/10 text-gold-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              ${mainBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Available for Instant Withdrawal</span>
            </div>
          </div>

          {/* Admin Remark for Main Balance (Only shown if remark is added) */}
          {profile?.balance_remark && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{profile.balance_remark}</span>
            </div>
          )}
        </div>

        {/* 2.2 Dedicated Cloud Mining Balance (Live Ticking + Miner Symbol) */}
        <div className={`p-6 rounded-2xl bg-dark-900/90 border transition-all relative overflow-hidden shadow-lg ${
          justTicked ? 'border-emerald-400/80 shadow-emerald-500/10' : 'border-slate-800 hover:border-emerald-500/50'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold uppercase tracking-wider">Cloud Mining Balance</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            {/* Animated Miner Pickaxe Icon */}
            <div className="p-2.5 rounded-xl bg-emerald-400/10 text-emerald-400 relative">
              <Pickaxe className="w-5 h-5 animate-bounce text-emerald-400" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight flex items-baseline gap-1">
              <span>${miningBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}</span>
            </div>
            
            {/* Live Yield Ticker Badge */}
            <div className="text-[11px] text-emerald-300 flex items-center justify-between mt-2 font-mono bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Live Mining: {hashrateSpeed} TH/s</span>
              </span>
              <span className="text-emerald-400 font-bold animate-pulse">
                +${sessionYieldEarned.toFixed(5)} cycle
              </span>
            </div>
          </div>
        </div>

        {/* 2.3 Realized Profit Balance */}
        <div className="p-6 rounded-2xl bg-dark-900/90 border border-slate-800 space-y-3 hover:border-slate-700 transition-all relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider">Cumulative Profit Balance</span>
            <div className="p-2.5 rounded-xl bg-indigo-400/10 text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-indigo-300 font-mono tracking-tight">
              ${profitBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-indigo-400 flex items-center gap-1 mt-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Realized Portfolio Returns</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Interactive Cloud Miner Rig Component (With Miner Symbol & Active Session Engine) */}
      <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-dark-950 to-slate-950 border border-emerald-500/30 shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Solved Block Notification Toast */}
        {solvedNotification && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-bounce shadow-lg">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{solvedNotification}</span>
          </div>
        )}

        {/* Miner Rig Header with Animated Miner Symbol */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center space-x-3.5">
            
            {/* Animated Miner Symbol with glowing ring and pickaxe */}
            <div className="relative w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-emerald-500/20 shadow-lg">
              <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400/40 animate-ping opacity-25" />
              <Pickaxe className="w-6 h-6 text-emerald-400 animate-pulse" />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-dark-950"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white flex items-center gap-1.5 font-mono">
                  <span>QUIBANDS CLOUD RIG &bull; ASSET MINER</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>SESSION ONLINE</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active 5-hour hashing session yielding $5.00 auto-credited to your account
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setHashrateSpeed(+(140 + Math.random() * 8).toFixed(2));
                setSharesAccepted((prev) => prev + 1);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Optimize Rig</span>
            </button>
          </div>
        </div>

        {/* 4 Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Session Countdown Timer */}
          <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Session Time Left</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {formatTime(sessionSecondsLeft)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Cycle: 5h 00m &bull; Auto-restarts
            </div>
          </div>

          {/* Card 2: Current Block Yield */}
          <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Session Yield Rate</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              ${sessionYieldEarned.toFixed(4)}
            </div>
            <div className="text-[10px] text-emerald-500 font-mono">
              Target: ${SESSION_TARGET_YIELD.toFixed(2)} / 5h session
            </div>
          </div>

          {/* Card 3: Realtime Hashrate */}
          <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Active Hashrate</span>
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-cyan-400 font-mono tracking-tight">
              {hashrateSpeed} <span className="text-xs font-semibold text-slate-400">TH/s</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Shares: {sharesAccepted} valid
            </div>
          </div>

          {/* Card 4: Block Hashing Target */}
          <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Active Target Block</span>
              <Server className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-300 font-mono tracking-tight">
              #{sessionBlockNumber}
            </div>
            <div className="text-[10px] text-slate-500 font-mono truncate" title={activeNonce}>
              Nonce: {activeNonce}
            </div>
          </div>

        </div>

        {/* Progress Bar for 5-Hour Session */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Session Progress</span>
            <span className="text-emerald-400 font-bold">
              {(((SESSION_TOTAL_SECONDS - sessionSecondsLeft) / SESSION_TOTAL_SECONDS) * 100).toFixed(1)}% Completed
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 transition-all duration-1000 rounded-full"
              style={{ width: `${Math.min(100, Math.max(1, ((SESSION_TOTAL_SECONDS - sessionSecondsLeft) / SESSION_TOTAL_SECONDS) * 100))}%` }}
            />
          </div>
        </div>

      </div>

      {/* 4. ACTIVITY & TRANSACTION LEDGER SECTION */}
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
                              'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                            }`}>
                              {t.type === 'mining_yield' ? 'MINING YIELD' :
                               t.type === 'deposit' ? 'DEPOSIT' :
                               t.type === 'withdrawal' ? 'WITHDRAWAL' :
                               'ACCOUNT CREDIT'}
                            </span>
                          </td>
                          <td className={`py-3 px-4 font-bold text-sm ${
                            t.type === 'withdrawal' ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {t.type === 'withdrawal' ? '-' : '+'}${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-slate-400">{t.asset}</span>
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-200">
                            <span className="font-semibold text-white">{t.memo || t.admin_notes || 'Account Adjustment'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 flex items-center gap-1 w-fit">
                              <Check className="w-3 h-3" />
                              <span>COMPLETED</span>
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
                      onClick={onOpenWithdrawal}
                      className="px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-colors"
                    >
                      Start Withdrawal
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((w) => {
                    const isApproved = w.status === 'APPROVED' || w.gas_fee_status === 'APPROVED';
                    const isPending = w.status === 'PENDING' && w.gas_fee_status !== 'APPROVED';
                    const isRejected = w.status === 'REJECTED' || w.gas_fee_status === 'REJECTED';

                    return (
                      <div key={w.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-white text-base">
                              {w.amount} {w.asset}
                            </span>
                            {w.converted_amount && (
                              <span className="text-xs text-slate-400 font-mono ml-2">
                                ({w.local_currency || 'USD'} {Number(w.converted_amount).toLocaleString()})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {isPending && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>PENDING GAS FEE REVIEW</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>GAS FEE APPROVED</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>REJECTED & REFUNDED</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-900 font-mono">
                          <div><span className="text-slate-500">20% Fee:</span> {w.fee_amount} {w.asset}</div>
                          <div><span className="text-slate-500">Net Payout:</span> {w.net_amount} {w.asset}</div>
                          <div><span className="text-slate-500">Payout Mode:</span> {w.payout_method || 'BANK'}</div>
                          <div><span className="text-slate-500">Date:</span> {new Date(w.created_at).toLocaleDateString()}</div>
                        </div>

                        {/* Post-Approval Active Withdrawal Button */}
                        {isApproved && onOpenWithdrawal && (
                          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                            <span className="text-xs text-emerald-400 font-medium">Clearance Ready</span>
                            <button
                              onClick={onOpenWithdrawal}
                              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-md flex items-center space-x-1"
                            >
                              <span>Withdraw Funds</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
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

