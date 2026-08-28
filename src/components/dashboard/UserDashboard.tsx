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
import { EditProfileModal } from './EditProfileModal';
import { KycModal } from './KycModal';
import { ReferralModal } from './ReferralModal';
import { InvestmentReturnsTable } from './InvestmentReturnsTable';
import { getMiningConfigForDeposit } from '../../utils/miningEngine';
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

  // Live Miner Engine States
  const [liveMiningBalance, setLiveMiningBalance] = useState<number>(0);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState<number>(12600);
  const [sessionBlockNumber, setSessionBlockNumber] = useState<number>(884219);
  const [sessionYieldEarned, setSessionYieldEarned] = useState<number>(0);
  const [sessionStatus, setSessionStatus] = useState<'ACTIVE' | 'SOLVING' | 'NEW_CYCLE'>('ACTIVE');
  const [hashrateSpeed, setHashrateSpeed] = useState<number>(0);
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
      if (refreshProfile) {
        await refreshProfile();
      }

      // Also directly fetch /api/profile for guaranteed instant reactive updates
      try {
        const profRes = await fetch(`${API_BASE}/profile`, { headers });
        const profJson = await profRes.json();
        if (profJson.success && profJson.data) {
          setFreshProfile(profJson.data);
        }
      } catch (profErr) {
        console.warn('Direct profile fetch error:', profErr);
      }

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
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 8000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Determine if user has activated mining by making a deposit or having positive balance
  // Financial Balances Calculation
  const activeProfile = freshProfile || profile;
  const approvedDepositsTotal = deposits.filter((d) => d.status === 'APPROVED').reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const depositBalanceUsd = Number(
    activeProfile?.deposit_balance !== undefined && Number(activeProfile.deposit_balance) > 0
      ? activeProfile.deposit_balance
      : (approvedDepositsTotal > 0 ? approvedDepositsTotal : (wallets['USDT'] || 0))
  );
  const miningBalanceUsd = liveMiningBalance > 0 ? liveMiningBalance : Number(activeProfile?.mining_balance !== undefined ? activeProfile.mining_balance : (activeProfile?.profit_balance || 0));
  const profitBalanceUsd = miningBalanceUsd;
  // Main balance = Entire Assets: Total of Capital (Deposit Balance) + Profit (Current Mining Balance / Amount Mined)
  const mainBalanceUsd = Number((depositBalanceUsd + miningBalanceUsd).toFixed(2));
  const convertBalance = Number(activeProfile?.convert_balance || 0);
  const convertCurrency = activeProfile?.convert_currency || 'SGD';
  const receiveLimitUsd = Number(activeProfile?.receive_limit || 9000.00);
  const accountTier = activeProfile?.account_tier || 'BASIC';

  // Dynamic Tier Calculation directly matching Investment Returns Table
  const miningConfig = getMiningConfigForDeposit(depositBalanceUsd);
  const hasApprovedDeposit = Boolean(depositBalanceUsd > 0 || deposits.some((d) => d.status === 'APPROVED'));
  const sessionTotalSeconds = miningConfig.sessionDurationSeconds;

  // Calculate session percentage
  const sessionPercent = Math.min(100, Math.max(0, Math.round(((sessionTotalSeconds - sessionSecondsLeft) / sessionTotalSeconds) * 100)));

  // Format time remaining as hh:mm:ss
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Periodic background database sync for live mined profit
  const lastSyncTimeRef = useRef<number>(Date.now());
  const syncMiningToBackend = async (currentMinedBalance: number) => {
    try {
      const headers = await getHeaders();
      await fetch(`${API_BASE}/profile/sync-mining`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ mining_balance: currentMinedBalance }),
      });
    } catch (e) {
      console.debug('Background mining sync deferred:', e);
    }
  };

  // =========================================================================
  // PERSISTENT USER-SCOPED MINING: NEVER RESTARTS ACROSS LOGINS/LOGOUTS & OFFLINE
  // =========================================================================
  useEffect(() => {
    if (!user?.id) return;
    const uid = user.id;

    if (!hasApprovedDeposit) {
      // User with $0 deposit: Miner strictly stays in STANDBY at 0
      setLiveMiningBalance(Number(activeProfile?.mining_balance || 0));
      setSessionSecondsLeft(sessionTotalSeconds);
      setSessionYieldEarned(0);
      setHashrateSpeed(0);
      // Clear any stale local start time so the next deposit starts freshly at 0
      localStorage.removeItem(`quibands_miner_${uid}_start_time`);
      localStorage.removeItem(`quibands_miner_${uid}_last_active`);
      return;
    }

    const now = Date.now();
    let savedStartTime = localStorage.getItem(`quibands_miner_${uid}_start_time`);
    const dbMiningBal = Number(activeProfile?.mining_balance || 0);

    if (!savedStartTime) {
      // User just deposited and starts mining freshly from 0.00 (or from admin-configured DB balance)
      savedStartTime = String(now);
      localStorage.setItem(`quibands_miner_${uid}_start_time`, savedStartTime);
      localStorage.setItem(`quibands_miner_${uid}_last_active`, savedStartTime);
      localStorage.setItem(`quibands_miner_${uid}_seconds_left`, String(sessionTotalSeconds));
      localStorage.setItem(`quibands_miner_${uid}_yield_earned`, '0');
      localStorage.setItem(`quibands_miner_${uid}_mining_balance`, String(dbMiningBal));

      setSessionSecondsLeft(sessionTotalSeconds);
      setSessionYieldEarned(0);
      setSessionBlockNumber(884219);
      setSharesAccepted(248);
      setLiveMiningBalance(dbMiningBal);
      setHashrateSpeed(142.84);
      return;
    }

    // Existing active miner: Calculate continuous progression including offline time
    const startTime = parseInt(savedStartTime, 10);
    const totalElapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));

    // Calculate exact progression matching active tier
    const cyclesCompleted = Math.floor(totalElapsedSeconds / sessionTotalSeconds);
    const secondsInCycle = totalElapsedSeconds % sessionTotalSeconds;
    const secLeft = Math.max(1, sessionTotalSeconds - secondsInCycle);
    const cycleYield = +(secondsInCycle * miningConfig.profitPerSecond).toFixed(5);
    const totalYieldAccrued = +(totalElapsedSeconds * miningConfig.profitPerSecond).toFixed(6);

    const effectiveMinedBalance = +(dbMiningBal + totalYieldAccrued).toFixed(6);

    setSessionSecondsLeft(secLeft);
    setSessionYieldEarned(cycleYield);
    setSessionBlockNumber(884219 + cyclesCompleted);
    setSharesAccepted(248 + Math.floor(totalElapsedSeconds / 15));
    setLiveMiningBalance(effectiveMinedBalance);
    setHashrateSpeed(142.84);
  }, [user?.id, hasApprovedDeposit, sessionTotalSeconds, miningConfig.profitPerSecond, activeProfile?.mining_balance]);

  // =========================================================================
  // LIVE MINER ENGINE: Starts ONLY after deposit and persists continuously
  // =========================================================================
  useEffect(() => {
    if (!hasApprovedDeposit || !user?.id) return;
    const uid = user.id;

    const interval = setInterval(() => {
      const basePerSec = miningConfig.profitPerSecond;
      const microVariance = (Math.random() - 0.5) * (basePerSec * 0.05);
      const microIncrement = +(basePerSec + microVariance).toFixed(6);

      let currentBal = 0;

      // Increment live balance and session yield
      setLiveMiningBalance((prev) => {
        const next = +(prev + microIncrement).toFixed(6);
        localStorage.setItem(`quibands_miner_${uid}_mining_balance`, String(next));
        currentBal = next;
        return next;
      });

      setSessionYieldEarned((prev) => {
        const nextYield = +(prev + microIncrement).toFixed(5);
        localStorage.setItem(`quibands_miner_${uid}_yield_earned`, String(nextYield));
        return nextYield;
      });

      // Trigger flash animation
      setJustTicked(true);
      setTimeout(() => setJustTicked(false), 500);

      // Fluctuate Hashrate slightly (142.1 ~ 143.9 TH/s)
      const newHash = +(142.5 + Math.random() * 1.4).toFixed(2);
      setHashrateSpeed(newHash);

      // Generate randomized cryptographic nonce
      const hexChars = '0123456789ABCDEF';
      let nonceStr = '0x';
      for (let i = 0; i < 8; i++) {
        nonceStr += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
      }
      setActiveNonce(nonceStr);

      // Session Countdown & Automatic Restart Logic
      setSessionSecondsLeft((prevSec) => {
        if (prevSec <= 1) {
          setSessionStatus('SOLVING');
          setSharesAccepted((s) => s + 1);
          const nextBlock = sessionBlockNumber + 1;
          setSessionBlockNumber(nextBlock);
          localStorage.setItem(`quibands_miner_${uid}_block_num`, String(nextBlock));

          setSolvedNotification(`${miningConfig.timeRangeText} Mining Cycle Complete! Block #${sessionBlockNumber} Verified: +$${miningConfig.targetSessionYield.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT credited. Next cycle initialized.`);
          setTimeout(() => setSolvedNotification(null), 6000);

          setSessionYieldEarned(0);
          localStorage.setItem(`quibands_miner_${uid}_yield_earned`, '0');
          setSessionStatus('ACTIVE');
          localStorage.setItem(`quibands_miner_${uid}_seconds_left`, String(sessionTotalSeconds));
          return sessionTotalSeconds;
        }
        const nextSec = prevSec - 1;
        if (nextSec % 10 === 0) {
          localStorage.setItem(`quibands_miner_${uid}_seconds_left`, String(nextSec));
        }
        return nextSec;
      });

      // Persist timestamp of last active heartbeat
      localStorage.setItem(`quibands_miner_${uid}_last_active`, String(Date.now()));

      // Periodic database sync every 20 seconds
      if (Date.now() - lastSyncTimeRef.current > 20000 && currentBal > 0) {
        lastSyncTimeRef.current = Date.now();
        syncMiningToBackend(currentBal);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasApprovedDeposit, user?.id, sessionTotalSeconds, miningConfig.profitPerSecond, sessionBlockNumber, miningConfig.targetSessionYield, miningConfig.timeRangeText]);


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
              onClick={() => {
                const el = document.getElementById('investment-returns-matrix');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-3 rounded-2xl bg-dark-950 border border-gold-500/40 hover:border-gold-400 text-gold-300 hover:text-white font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-gold-400" />
              <span>Investment Rates Table</span>
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
                onClick={() => onOpenConvert(depositBalanceUsd, miningBalanceUsd, mainBalanceUsd)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>Convert</span>
              </button>
            )}

            {onOpenWithdrawal && (
              <button
                type="button"
                onClick={() => onOpenWithdrawal(depositBalanceUsd, miningBalanceUsd, mainBalanceUsd)}

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

      {/* 2. Financial Balances Section (Deposit Balance, Current Mining Balance, and Main Balance [Capital + Profit]) */}
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

          {/* 2.2 Current Mining Balance (Amount Mined So Far / Profit) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/95 border border-emerald-500/30 hover:border-emerald-400/60 transition-all relative overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                  <Pickaxe className="w-4 h-4 text-emerald-400" />
                  <span>Current Mining Balance</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                  TOTAL MINED
                </span>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tracking-tight">
                  ${miningBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-emerald-400/80 flex items-center gap-1.5 mt-1 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {hasApprovedDeposit ? (
                      <>Live Session: +${sessionYieldEarned.toFixed(2)} &bull; {miningConfig.hourlyRateText}</>
                    ) : (
                      <>All-Time Assets Mined So Far (Standby)</>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Remark for Mining Balance */}
            {profile?.mining_remark && (
              <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-400" />
                <span className="leading-tight">{profile.mining_remark}</span>
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
                  <span className="text-emerald-400 font-bold">${miningBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Profit</span>
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
                  }{convertBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-semibold text-emerald-400">{convertCurrency} Mine Assets</span>
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

      {/* 3. Interactive Cloud Miner Rig Component (With Miner Symbol & Active Session Engine) */}
      <div className={`rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-dark-950 to-slate-950 border shadow-2xl space-y-6 relative overflow-hidden ${
        hasApprovedDeposit ? 'border-emerald-500/30' : 'border-slate-800'
      }`}>
        
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
            <div className={`relative w-12 h-12 rounded-2xl border flex items-center justify-center shadow-lg ${
              hasApprovedDeposit 
                ? 'bg-emerald-950/80 border-emerald-400/50 text-emerald-400 shadow-emerald-500/20' 
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}>
              {hasApprovedDeposit && (
                <>
                  <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400/40 animate-ping opacity-25" />
                  <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-dark-950"></span>
                  </span>
                </>
              )}
              <Pickaxe className={`w-6 h-6 ${hasApprovedDeposit ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            </div>

            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="text-base font-extrabold text-white flex items-center gap-1.5 font-mono">
                  <span>QUIBANDS CLOUD RIG &bull; ASSET MINER</span>
                </h3>
                {hasApprovedDeposit ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>MINING: ${miningConfig.tierInvestment.toLocaleString()} TIER &bull; {miningConfig.timeRangeText}</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>STANDBY (AWAITING INITIAL DEPOSIT)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasApprovedDeposit 
                  ? `Active ${miningConfig.timeRangeText} hashing cycle yielding target profit of $${miningConfig.targetSessionYield.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${miningConfig.hourlyRateText})` 
                  : 'Mining cluster is currently in standby. Make an initial deposit according to the Investment Rates Table below to initiate automated cloud mining.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasApprovedDeposit ? (
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
            ) : (
              <button
                onClick={onOpenDeposit}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5 transform active:scale-95 animate-pulse"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Deposit &amp; Start Miner</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Session Countdown Timer */}
          <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Session Time Left</span>
              <Clock className={`w-3.5 h-3.5 ${hasApprovedDeposit ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {hasApprovedDeposit ? formatTime(sessionSecondsLeft) : 'Paused'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {hasApprovedDeposit ? `Cycle: ${miningConfig.timeRangeText} \u2022 Auto-restarts` : `Cycle: ${miningConfig.timeRangeText} (Standby)`}
            </div>
          </div>

          {/* Card 2: Current Block Yield */}
          <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Session Yield Earned</span>
              <DollarSign className={`w-3.5 h-3.5 ${hasApprovedDeposit ? 'text-emerald-400' : 'text-slate-500'}`} />
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight ${hasApprovedDeposit ? 'text-emerald-400' : 'text-slate-400'}`}>
              ${hasApprovedDeposit ? sessionYieldEarned.toFixed(4) : '0.0000'}
            </div>
            <div className="text-[10px] text-emerald-500 font-mono">
              Target: ${miningConfig.targetSessionYield.toLocaleString(undefined, { minimumFractionDigits: 2 })} / session
            </div>
          </div>

          {/* Card 3: Hourly Profit Rate */}
          <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Hourly Profit Rate</span>
              <Radio className={`w-3.5 h-3.5 ${hasApprovedDeposit ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${hasApprovedDeposit ? 'text-cyan-400' : 'text-slate-400'}`}>
              {hasApprovedDeposit ? miningConfig.hourlyRateText : '$0.00 /h'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {hasApprovedDeposit ? `Tier ROI: ${miningConfig.roiText}` : 'ASIC Cluster Unallocated'}
            </div>
          </div>

          {/* Card 4: Total Assets Mined So Far */}
          <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>All-Time Assets Mined</span>
              <Server className={`w-3.5 h-3.5 ${hasApprovedDeposit ? 'text-purple-400' : 'text-slate-500'}`} />
            </div>
            <div className="text-2xl font-black text-purple-300 font-mono tracking-tight">
              ${miningBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-purple-400/80 font-mono truncate">
              {hasApprovedDeposit ? `Block #${sessionBlockNumber} \u2022 ${sharesAccepted} Valid Shares` : 'Awaiting Initial Deposit'}
            </div>
          </div>

        </div>

        {/* Progress Bar for Session Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Session Progress</span>
            <span className={hasApprovedDeposit ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {hasApprovedDeposit ? `${sessionPercent}% Completed (${miningConfig.timeRangeText} Cycle)` : '0.0% (Standby)'}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div 
              className={`h-full transition-all duration-1000 rounded-full ${
                hasApprovedDeposit ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500' : 'bg-slate-800'
              }`}
              style={{ width: `${sessionPercent}%` }}
            />
          </div>
        </div>

      </div>

      {/* 4. INVESTMENT RETURNS, ROI & HOURLY RATE TABLE MATRIX */}
      <InvestmentReturnsTable onSelectDepositPlan={onOpenDeposit} />

      {/* 5. ACTIVITY & TRANSACTION LEDGER SECTION */}
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
