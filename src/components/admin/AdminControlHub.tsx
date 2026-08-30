import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldAlert, 
  WalletCards, 
  Bell, 
  X, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  KeyRound, 
  DollarSign, 
  LogOut, 
  Flag, 
  Eye, 
  Plus, 
  History,
  Copy,
  Check,
  ArrowLeft,
  Smartphone,
  Monitor,
  Globe,
  Radio,
  ExternalLink,
  ArrowDownCircle,
  ArrowUpCircle,
  Percent,
  Clock,
  XCircle,
  CheckCircle2,
  Sliders,
  Settings,
  Cpu,
  TrendingUp,
  Award,
  ShieldCheck,
  Zap,
  Building2,
  FileCheck,
  Camera,
  Image as ImageIcon,
  ZoomIn,
  Trash2,
  Mail,
  Edit,
  MessageSquare,
  Terminal,
  Coins,
  Info,
  AlertCircle,
  Play,
  Square,
  Pause
} from 'lucide-react';

import { AdminSupportChatTab } from './AdminSupportChatTab';

import { useAuth } from '../../context/AuthContext';
import { 
  UserProfile, 
  BankDetails,
  SecurityLog, 
  AdminNotification, 
  DepositAddress, 
  DepositAddressHistory, 
  UserDossier,
  DepositRequest,
  WithdrawalRequest,
  WithdrawalFeeRecord,
  KycSubmission,
  ConversionRequest
} from '../../types';
import { supabase } from '../../lib/supabase';
import { adminDirectClient } from '../../lib/adminDirectClient';
import { API_BASE } from '../../config/api';
import { DevAuthAdminTest } from '../dev/DevAuthAdminTest';



interface AdminControlHubProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'users' | 'deposits' | 'conversions' | 'withdrawals' | 'kyc' | 'support' | 'fees' | 'settings' | 'security' | 'treasury' | 'notifications';

export const AdminControlHub: React.FC<AdminControlHubProps> = ({ isOpen, onClose }) => {
  const { session, profile, role, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>(() => {

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quibands_admin_tab') as TabType;
      if (saved && ['users', 'deposits', 'conversions', 'withdrawals', 'kyc', 'support', 'fees', 'settings', 'security', 'treasury', 'notifications'].includes(saved)) {
        return saved;
      }
    }
    return 'users';
  });

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedUserId(null);
    setMobileToolsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quibands_admin_tab', tab);
    }
  };

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


  // Data States
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDossier, setUserDossier] = useState<UserDossier | null>(null);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [depositAddresses, setDepositAddresses] = useState<DepositAddress[]>([]);
  const [addressHistory, setAddressHistory] = useState<DepositAddressHistory[]>([]);
  const [adminDeposits, setAdminDeposits] = useState<DepositRequest[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalFees, setWithdrawalFees] = useState<WithdrawalFeeRecord[]>([]);
  const [conversions, setConversions] = useState<ConversionRequest[]>([]);
  const [kycSubmissions, setKycSubmissions] = useState<KycSubmission[]>([]);
  const [selectedKyc, setSelectedKyc] = useState<KycSubmission | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [testConsoleOpen, setTestConsoleOpen] = useState(false);

  // System Settings State
  const [gasFeeAddress, setGasFeeAddress] = useState('TYDzsYUEpvnYmQk4zGP9sWWcTEd36AMW9y');
  const [gasFeeNetwork, setGasFeeNetwork] = useState('TRC20');
  const [tierUpgradeAddress, setTierUpgradeAddress] = useState('TYDzsYUEpvnYmQk4zGP9sWWcTEd36AMW9y');
  const [tierUpgradeNetwork, setTierUpgradeNetwork] = useState('TRC20');
  const [defaultReceiveLimit, setDefaultReceiveLimit] = useState('9000.00');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'flagged'>('all');
  const [depositFilter, setDepositFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [conversionFilter, setConversionFilter] = useState<'all' | 'PENDING' | 'CONVERTED' | 'REJECTED'>('all');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [kycFilter, setKycFilter] = useState<'all' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('all');
  const [feeFilter, setFeeFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');


  // Action Modals State
  const [actionModal, setActionModal] = useState<{
    type: 'suspend' | 'flag' | 'reset-password' | 'set-password' | 'adjust-balance' | 'edit-financials' | 'add-address' | 'approve-deposit' | 'reject-deposit' | 'approve-withdrawal' | 'reject-withdrawal' | 'review-gas-fee' | null;
    userId?: string;
    targetUser?: UserProfile | null;
    deposit?: DepositRequest | null;
    withdrawal?: WithdrawalRequest | null;
    feeRecord?: WithdrawalFeeRecord | null;
  }>({ type: null });

  // Financial Balance Editor Form
  const [financialDepositBalance, setFinancialDepositBalance] = useState('');
  const [financialMainBalance, setFinancialMainBalance] = useState('');
  const [financialMiningBalance, setFinancialMiningBalance] = useState('');
  const [financialProfitBalance, setFinancialProfitBalance] = useState('');
  const [financialConvertBalance, setFinancialConvertBalance] = useState('');
  const [financialConvertCurrency, setFinancialConvertCurrency] = useState('SGD');
  const [financialReceiveLimit, setFinancialReceiveLimit] = useState('9000.00');
  const [financialAccountTier, setFinancialAccountTier] = useState('BASIC');
  const [financialDepositRemark, setFinancialDepositRemark] = useState('');
  const [financialBalanceRemark, setFinancialBalanceRemark] = useState('');
  const [financialMiningRemark, setFinancialMiningRemark] = useState('');
  const [financialProfitRemark, setFinancialProfitRemark] = useState('');

  // Form Inputs
  const [actionReason, setActionReason] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustCurrency, setAdjustCurrency] = useState('USD');

  // New Deposit Address Form / Modal
  const [depositModal, setDepositModal] = useState<{
    isOpen: boolean;
    isEdit: boolean;
    id?: string;
    asset: string;
    network: string;
    address: string;
    memoTag: string;
    notes: string;
    isActive: boolean;
  }>({
    isOpen: false,
    isEdit: false,
    asset: 'BTC',
    network: 'BTC',
    address: '',
    memoTag: '',
    notes: '',
    isActive: true,
  });

  // User Password Modal
  const [passModal, setPassModal] = useState<{
    isOpen: boolean;
    userId: string;
    userEmail: string;
    tempPassword?: string | null;
    newPassword: string;
  }>({
    isOpen: false,
    userId: '',
    userEmail: '',
    tempPassword: null,
    newPassword: '',
  });

  const [withdrawalModal, setWithdrawalModal] = useState<{
    isOpen: boolean;
    withdrawal: WithdrawalRequest | null;
    action: 'APPROVE' | 'REJECT';
    remark: string;
  }>({
    isOpen: false,
    withdrawal: null,
    action: 'APPROVE',
    remark: '',
  });

  const [bankModal, setBankModal] = useState<{
    isOpen: boolean;
    user: UserProfile | null;
    bankDetails?: BankDetails | null;
    title?: string;
  }>({
    isOpen: false,
    user: null,
    bankDetails: null,
    title: '',
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showBanner = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };


  const getHeaders = async () => {
    const token = session?.access_token || (await supabase.auth.getSession()).data?.session?.access_token;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    };
  };

  const safeFetchJson = async (url: string, headers: any): Promise<any> => {
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) return null;
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return null;
      }
    } catch (e) {
      return null;
    }
  };

  // Fetch data with high-resiliency parallel fetching & profile joins
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();

      // Parallelize fetching all admin tabs for instant responsiveness
      const [
        settingsRes,
        usersRes,
        depositsRes,
        withdrawalsRes,
        conversionsRes,
        kycRes,
        feesRes,
        securityRes,
        treasuryRes,
        notifsRes,
      ] = await Promise.allSettled([
        safeFetchJson(`${API_BASE}/admin/settings`, headers),
        safeFetchJson(`${API_BASE}/admin/users`, headers),
        safeFetchJson(`${API_BASE}/admin/deposits`, headers),
        safeFetchJson(`${API_BASE}/admin/withdrawals`, headers),
        safeFetchJson(`${API_BASE}/conversions`, headers),
        safeFetchJson(`${API_BASE}/admin/kyc`, headers),
        safeFetchJson(`${API_BASE}/admin/withdrawal-fees`, headers),
        safeFetchJson(`${API_BASE}/admin/security/logs`, headers),
        safeFetchJson(`${API_BASE}/admin/deposit-addresses`, headers),
        safeFetchJson(`${API_BASE}/admin/security/notifications`, headers),
      ]);

      // 1. Process Settings
      if (settingsRes.status === 'fulfilled' && settingsRes.value?.success && settingsRes.value?.data) {
        const d = settingsRes.value.data;
        if (d.gas_fee_address) {
          setGasFeeAddress(d.gas_fee_address.value);
          if (d.gas_fee_address.network) setGasFeeNetwork(d.gas_fee_address.network);
        }
        if (d.tier_upgrade_address) {
          setTierUpgradeAddress(d.tier_upgrade_address.value);
          if (d.tier_upgrade_address.network) setTierUpgradeNetwork(d.tier_upgrade_address.network);
        }
        if (d.default_receive_limit) {
          setDefaultReceiveLimit(d.default_receive_limit.value);
        }
      } else {
        const { data: dbSettings } = await adminDirectClient.from('system_settings').select('*');
        if (dbSettings) {
          const map: Record<string, any> = {};
          dbSettings.forEach((s: any) => { map[s.key] = s; });
          if (map.gas_fee_address) setGasFeeAddress(map.gas_fee_address.value);
          if (map.tier_upgrade_address) setTierUpgradeAddress(map.tier_upgrade_address.value);
          if (map.default_receive_limit) setDefaultReceiveLimit(map.default_receive_limit.value);
        }
      }

      // 2. Process Users
      let currentProfiles: any[] = [];
      if (usersRes.status === 'fulfilled' && usersRes.value?.data && Array.isArray(usersRes.value.data)) {
        currentProfiles = usersRes.value.data;
        setUsers(currentProfiles);
      } else {
        const { data: dbProfiles } = await adminDirectClient.from('profiles').select('*').order('created_at', { ascending: false });
        if (dbProfiles) {
          currentProfiles = dbProfiles;
          setUsers(dbProfiles as any);
        }
      }

      const profileMap = new Map<string, any>(currentProfiles.map(p => [p.auth_user_id, p]));

      // 3. Process Deposits
      if (depositsRes.status === 'fulfilled' && depositsRes.value?.data && Array.isArray(depositsRes.value.data)) {
        const deps = depositsRes.value.data.map((d: any) => ({
          ...d,
          user_profile: d.user_profile || profileMap.get(d.user_id),
        }));
        setAdminDeposits(deps);
      } else {
        const { data: dbDeps } = await adminDirectClient.from('deposit_requests').select('*').order('created_at', { ascending: false });
        if (dbDeps) {
          const deps = dbDeps.map((d: any) => ({
            ...d,
            user_profile: profileMap.get(d.user_id),
          }));
          setAdminDeposits(deps as any);
        }
      }

      // 4. Process Withdrawals
      if (withdrawalsRes.status === 'fulfilled' && withdrawalsRes.value?.data && Array.isArray(withdrawalsRes.value.data)) {
        const wds = withdrawalsRes.value.data.map((w: any) => ({
          ...w,
          user_profile: w.user_profile || profileMap.get(w.user_id),
        }));
        setAdminWithdrawals(wds);
      } else {
        const { data: dbWds } = await adminDirectClient.from('withdrawal_requests').select('*').order('created_at', { ascending: false });
        if (dbWds) {
          const wds = dbWds.map((w: any) => ({
            ...w,
            user_profile: profileMap.get(w.user_id),
          }));
          setAdminWithdrawals(wds as any);
        }
      }

      // 5. Process Conversions
      if (conversionsRes.status === 'fulfilled' && conversionsRes.value?.data && Array.isArray(conversionsRes.value.data)) {
        const convs = conversionsRes.value.data.map((c: any) => ({
          ...c,
          user_email: c.user_email || profileMap.get(c.user_id)?.email,
          user_profile: profileMap.get(c.user_id),
        }));
        setConversions(convs);
      } else {
        const { data: dbConvs } = await adminDirectClient.from('conversion_requests').select('*').order('created_at', { ascending: false });
        if (dbConvs) {
          const convs = dbConvs.map((c: any) => ({
            ...c,
            user_email: c.user_email || profileMap.get(c.user_id)?.email,
            user_profile: profileMap.get(c.user_id),
          }));
          setConversions(convs as any);
        }
      }

      // 6. Process KYC
      if (kycRes.status === 'fulfilled' && kycRes.value?.data && Array.isArray(kycRes.value.data)) {
        const kycs = kycRes.value.data.map((k: any) => ({
          ...k,
          user_profile: k.user_profile || profileMap.get(k.user_id),
        }));
        setKycSubmissions(kycs);
      } else {
        const { data: dbKyc } = await adminDirectClient.from('kyc_submissions').select('*').order('created_at', { ascending: false });
        if (dbKyc) {
          const kycs = dbKyc.map((k: any) => ({
            ...k,
            user_profile: profileMap.get(k.user_id),
          }));
          setKycSubmissions(kycs as any);
        }
      }

      // 7. Process Withdrawal Fees
      if (feesRes.status === 'fulfilled' && feesRes.value?.data && Array.isArray(feesRes.value.data)) {
        setWithdrawalFees(feesRes.value.data);
      } else {
        const { data: dbFees } = await adminDirectClient.from('withdrawal_fees').select('*').order('created_at', { ascending: false });
        if (dbFees) setWithdrawalFees(dbFees as any);
      }

      // 8. Process Security Logs
      if (securityRes.status === 'fulfilled' && securityRes.value?.data && Array.isArray(securityRes.value.data)) {
        setSecurityLogs(securityRes.value.data);
      } else {
        const { data: dbLogs } = await adminDirectClient.from('security_logs').select('*').order('created_at', { ascending: false });
        if (dbLogs) setSecurityLogs(dbLogs as any);
      }

      // 9. Process Deposit Addresses / Treasury
      if (treasuryRes.status === 'fulfilled' && treasuryRes.value?.data && Array.isArray(treasuryRes.value.data)) {
        setDepositAddresses(treasuryRes.value.data);
      } else {
        const { data: dbAddrs } = await adminDirectClient.from('deposit_addresses').select('*').order('created_at', { ascending: false });
        if (dbAddrs) setDepositAddresses(dbAddrs as any);
      }

      // 10. Process Notifications
      if (notifsRes.status === 'fulfilled' && notifsRes.value?.data && Array.isArray(notifsRes.value.data)) {
        setNotifications(notifsRes.value.data);
      } else {
        const { data: dbNotifs } = await adminDirectClient.from('admin_notifications').select('*').order('created_at', { ascending: false });
        if (dbNotifs) setNotifications(dbNotifs as any);
      }

    } catch (err: any) {
      console.warn('Admin fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, activeTab, session?.access_token]);

  // Load User Dossier with fallback
  const loadUserDossier = async (userId: string) => {
    if (!userId) return;
    setSelectedUserId(userId);
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const json = await safeFetchJson(`${API_BASE}/admin/users/${userId}/dossier`, headers);
      if (json?.success && json?.data) {
        setUserDossier(json.data);
      } else {
        const [profRes, depRes, wdRes, txRes, kycRes] = await Promise.all([
          adminDirectClient.from('profiles').select('*').eq('auth_user_id', userId).maybeSingle(),
          adminDirectClient.from('deposit_requests').select('*').eq('user_id', userId),
          adminDirectClient.from('withdrawal_requests').select('*').eq('user_id', userId),
          adminDirectClient.from('transactions').select('*').eq('user_id', userId),
          adminDirectClient.from('kyc_submissions').select('*').eq('user_id', userId).maybeSingle(),
        ]);
        if (profRes.data) {
          setUserDossier({
            profile: profRes.data as any,
            deposits: depRes.data || [],
            withdrawals: wdRes.data || [],
            transactions: txRes.data || [],
            kyc: kycRes.data || null,
            securityLogs: [],
          });
        }
      }
    } catch (err: any) {
      showBanner('error', err.message || 'Failed to load user dossier.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Financial Balances Editor Modal
  const openFinancialEditor = (u: UserProfile) => {
    const targetUid = u.auth_user_id || u.id;
    setActionModal({ type: 'edit-financials', userId: targetUid, targetUser: u });
    const depVal = u.deposit_balance !== undefined ? String(u.deposit_balance) : '0';
    // For old accounts, resolve minVal from mining_balance or profit_balance
    const minVal = u.mining_balance !== undefined && Number(u.mining_balance) > 0
      ? String(u.mining_balance)
      : (u.profit_balance !== undefined ? String(u.profit_balance) : '0');
    const mainVal = u.main_balance !== undefined && Number(u.main_balance) > 0
      ? String(u.main_balance)
      : String((parseFloat(depVal) || 0) + (parseFloat(minVal) || 0));

    setFinancialDepositBalance(depVal);
    setFinancialMiningBalance(minVal);
    setFinancialProfitBalance(minVal);
    setFinancialMainBalance(mainVal);
    setFinancialConvertBalance(u.convert_balance !== undefined ? String(u.convert_balance) : '0');
    setFinancialConvertCurrency(u.convert_currency || 'SGD');
    setFinancialReceiveLimit(u.receive_limit !== undefined ? String(u.receive_limit) : '9000.00');
    setFinancialAccountTier(u.account_tier || 'BASIC');
    setFinancialDepositRemark(u.deposit_remark || '');
    setFinancialBalanceRemark(u.balance_remark || '');
    setFinancialMiningRemark(u.mining_remark || '');
    setFinancialProfitRemark(u.profit_remark || '');
  };

  // Save User Financial Balances & Limits with direct DB fallback
  const handleSaveFinancials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.userId) return;

    setActionLoading(true);
    try {
      const depVal = parseFloat(financialDepositBalance) || 0;
      const minVal = parseFloat(financialMiningBalance) || 0;
      const profVal = minVal; // Always sync profit_balance with mining_balance
      const mainVal = parseFloat(financialMainBalance) || (depVal + minVal);
      const convVal = parseFloat(financialConvertBalance) || 0;
      const recLimit = parseFloat(financialReceiveLimit) || 9000;

      let isSuccess = false;
      try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE}/admin/users/${actionModal.userId}/financial-balances`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            depositBalance: depVal,
            mainBalance: mainVal,
            miningBalance: minVal,
            profitBalance: minVal,
            convertBalance: convVal,
            convertCurrency: financialConvertCurrency,
            receiveLimit: recLimit,
            accountTier: financialAccountTier,
            depositRemark: financialDepositRemark.trim() || null,
            balanceRemark: financialBalanceRemark.trim() || null,
            miningRemark: financialMiningRemark.trim() || null,
            profitRemark: financialProfitRemark.trim() || null,
          }),
        });

        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.success) isSuccess = true;
        }
      } catch (e) {}

      if (!isSuccess) {
        const nowIso = new Date().toISOString();
        // 1. Direct Profile update by auth_user_id AND id
        await adminDirectClient
          .from('profiles')
          .update({
            deposit_balance: depVal,
            main_balance: mainVal,
            mining_balance: minVal,
            profit_balance: minVal,
            convert_balance: convVal,
            convert_currency: financialConvertCurrency,
            receive_limit: recLimit,
            account_tier: financialAccountTier,
            deposit_remark: financialDepositRemark.trim() || null,
            balance_remark: financialBalanceRemark.trim() || null,
            mining_remark: financialMiningRemark.trim() || null,
            profit_remark: financialProfitRemark.trim() || null,
            metadata: {
              ...(actionModal.targetUser?.metadata || {}),
              mining_started_at: nowIso,
              mining_base_balance: minVal,
              mining_last_sync_at: nowIso,
            },
            updated_at: nowIso,
          })
          .or(`auth_user_id.eq.${actionModal.userId},id.eq.${actionModal.userId}`);

        // 2. Direct Wallet update
        await adminDirectClient
          .from('wallets')
          .update({
            balance: mainVal,
            deposit_balance: depVal,
            mining_balance: minVal,
            profit_balance: minVal,
            updated_at: nowIso,
          })
          .eq('user_id', actionModal.userId);

        isSuccess = true;
      }

      if (isSuccess) {
        showBanner('success', 'User balances, limits, and remarks updated successfully.');
        setActionModal({ type: null });
        await fetchData();
        if (selectedUserId === actionModal.userId) {
          await loadUserDossier(selectedUserId);
        }
      } else {
        showBanner('error', 'Failed to update financial balances.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Deposit Address Editor Modal (strictly BTC, ERC20, BNB)
  const openDepositAddressModal = (addr?: DepositAddress | null, defaultCoin?: 'BTC' | 'ERC20' | 'BNB') => {
    const targetCoin: 'BTC' | 'ERC20' | 'BNB' = defaultCoin || (addr ? (addr.asset as any) : 'BTC');
    
    // Find matching existing address in depositAddresses list
    let existingAddr = addr;
    if (!existingAddr) {
      existingAddr = depositAddresses.find(a => {
        const aUpper = (a.asset || '').toUpperCase();
        const nUpper = (a.network || '').toUpperCase();
        if (targetCoin === 'BTC') return aUpper === 'BTC' || aUpper === 'BITCOIN' || nUpper === 'BTC' || nUpper === 'NATIVE';
        if (targetCoin === 'ERC20') return aUpper === 'ERC20' || nUpper === 'ERC20' || aUpper === 'ETH' || aUpper === 'USDT';
        if (targetCoin === 'BNB') return aUpper === 'BNB' || aUpper === 'BSC' || nUpper === 'BEP20' || nUpper === 'BNB';
        return aUpper === targetCoin;
      }) || null;
    }

    if (existingAddr) {
      setDepositModal({
        isOpen: true,
        isEdit: true,
        id: existingAddr.id,
        asset: targetCoin,
        network: targetCoin === 'BNB' ? 'BEP20' : (targetCoin === 'ERC20' ? 'ERC20' : 'BTC'),
        address: existingAddr.address,
        memoTag: existingAddr.memo_tag || '',
        notes: existingAddr.notes || '',
        isActive: existingAddr.is_active,
      });
    } else {
      setDepositModal({
        isOpen: true,
        isEdit: false,
        asset: targetCoin,
        network: targetCoin === 'BNB' ? 'BEP20' : (targetCoin === 'ERC20' ? 'ERC20' : 'BTC'),
        address: '',
        memoTag: '',
        notes: '',
        isActive: true,
      });
    }
  };

  // Save / Update Deposit Address
  const handleSaveDepositAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const url = depositModal.isEdit && depositModal.id
        ? `${API_BASE}/admin/deposit-addresses/${depositModal.id}`
        : `${API_BASE}/admin/deposit-addresses`;
      const method = depositModal.isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          asset: depositModal.asset.toUpperCase(),
          network: depositModal.network.toUpperCase(),
          address: depositModal.address.trim(),
          memoTag: depositModal.memoTag.trim() || null,
          notes: depositModal.notes.trim() || null,
          isActive: depositModal.isActive,
          setAsActive: depositModal.isActive,
          reason: 'Administrator updated deposit credentials',
        }),
      });

      const json = await res.json();
      if (json.success) {
        showBanner('success', `Deposit address for ${depositModal.asset} saved & active on user dashboard.`);
        setDepositModal((prev) => ({ ...prev, isOpen: false }));
        fetchData();
      } else {
        showBanner('error', json.error || 'Failed to save deposit address.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Deposit Address Active Status
  const handleToggleDepositAddress = async (addr: DepositAddress) => {
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/admin/deposit-addresses/${addr.id}/toggle`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          isActive: !addr.is_active,
          reason: `Admin toggled status to ${!addr.is_active ? 'active' : 'inactive'}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', `Address for ${addr.asset} (${addr.network}) is now ${!addr.is_active ? 'ACTIVE' : 'INACTIVE'}.`);
        fetchData();
      } else {
        showBanner('error', json.error || 'Failed to toggle address status.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Password Modal
  const openPassModal = (u: UserProfile) => {
    setPassModal({
      isOpen: true,
      userId: u.auth_user_id,
      userEmail: u.email,
      tempPassword: (u as any).temp_password || null,
      newPassword: '',
    });
  };

  // Direct Set Password
  const handleDirectSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passModal.userId || !passModal.newPassword) return;
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/admin/users/${passModal.userId}/set-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ newPassword: passModal.newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', `Password for ${passModal.userEmail} has been updated.`);
        setPassModal((prev) => ({ ...prev, isOpen: false }));
        fetchData();
      } else {
        showBanner('error', json.error || 'Failed to set user password.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Force Logout User
  const handleForceLogout = async (u: UserProfile) => {
    if (!confirm(`Are you sure you want to FORCE LOGOUT ${u.email}? All active login sessions will be instantly revoked.`)) return;
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/admin/users/${u.auth_user_id}/force-logout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: 'Admin revoked sessions' }),
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', `User ${u.email} has been forcibly logged out.`);
      } else {
        showBanner('error', json.error || 'Failed to revoke user sessions.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle User Cloud Miner Status (Active vs Stopped)
  const handleToggleMiner = async (u: UserProfile) => {
    const isCurrentlyStopped = u.miner_status === 'stopped';
    const nextAction = isCurrentlyStopped ? 'RESUME / ACTIVATE' : 'STOP / PAUSE';
    if (!confirm(`Are you sure you want to ${nextAction} the cloud miner for ${u.email}?`)) return;

    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/admin/users/${u.auth_user_id}/toggle-miner`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status: isCurrentlyStopped ? 'active' : 'stopped' }),
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', json.message || `Miner is now ${isCurrentlyStopped ? 'ACTIVE' : 'STOPPED'}.`);
        fetchData();
        if (selectedUserId === u.auth_user_id) {
          loadUserDossier(u.auth_user_id);
        }
      } else {
        showBanner('error', json.error || 'Failed to toggle miner status.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Send Password Reset Email
  const handleSendResetEmail = async (u: UserProfile) => {
    if (!confirm(`Dispatch password recovery reset email to ${u.email}?`)) return;
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/admin/users/${u.auth_user_id}/send-reset-email`, {
        method: 'POST',
        headers,
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', `Password reset link dispatched to ${u.email}.`);
      } else {
        showBanner('error', json.error || 'Failed to send reset email.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Terminate User Account
  const handleTerminateAccount = async (u: UserProfile) => {
    const confirmInput = prompt(`WARNING: You are about to permanently TERMINATE and PURGE account for ${u.email}.\nType "DELETE" to confirm:`);
    if (confirmInput !== 'DELETE') return;
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/admin/users/${u.auth_user_id}/terminate`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ reason: 'Account terminated by SuperAdmin' }),
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', `User ${u.email} has been permanently deleted.`);
        fetchData();
        if (selectedUserId === u.auth_user_id) setSelectedUserId(null);
      } else {
        showBanner('error', json.error || 'Failed to delete user.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Save System Settings (Gas Fee Address, Upgrade Address, Limit)

  const handleSaveSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const headers = await getHeaders();

      // 1. Gas fee address
      await fetch(`${API_BASE}/admin/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          key: 'gas_fee_address',
          value: gasFeeAddress.trim(),
          network: gasFeeNetwork,
          description: '20% Withdrawal Gas Fee Treasury Vault',
        }),
      });

      // 2. Tier upgrade address
      await fetch(`${API_BASE}/admin/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          key: 'tier_upgrade_address',
          value: tierUpgradeAddress.trim(),
          network: tierUpgradeNetwork,
          description: 'Account Tier Upgrade Payment Vault',
        }),
      });

      // 3. Default receive limit
      await fetch(`${API_BASE}/admin/settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          key: 'default_receive_limit',
          value: defaultReceiveLimit.trim(),
          description: 'Default user receive limit threshold',
        }),
      });

      showBanner('success', 'System Treasury & Payout Settings saved successfully.');
      fetchData();
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Review Gas Fee Payment / Withdrawal (Approve or Reject with Auto-Refund) with direct DB fallback
  const handleReviewGasFee = async (withdrawalId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    setActionLoading(true);
    try {
      let isSuccess = false;
      try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE}/admin/withdrawals/${withdrawalId}/review-gas-fee`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ action, reason }),
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.success) isSuccess = true;
        }
      } catch (e) {}

      if (!isSuccess) {
        await adminDirectClient
          .from('withdrawal_requests')
          .update({
            status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            rejection_reason: reason || null,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', withdrawalId);
        isSuccess = true;
      }

      if (isSuccess) {
        showBanner('success', `Withdrawal ${action === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
        setActionModal({ type: null });
        setActionReason('');
        fetchData();
      } else {
        showBanner('error', 'Failed to review withdrawal.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // User Actions (Suspend, Flag, Password, etc.)
  const handleUserAction = async (endpoint: string, payload: any, successMsg: string) => {
    if (!selectedUserId) return;
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/admin/users/${selectedUserId}/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (json?.success) {
        showBanner('success', successMsg);
        setActionModal({ type: null });
        setActionReason('');
        setCustomPassword('');
        setAdjustAmount('');
        loadUserDossier(selectedUserId);
        fetchData();
      } else {
        showBanner('error', json?.error || 'Action completed.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Deposit with direct DB fallback
  const handleApproveDeposit = async (depositId: string) => {
    setActionLoading(true);
    try {
      let isSuccess = false;
      try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE}/admin/deposits/${depositId}/approve`, {
          method: 'POST',
          headers,
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.success) isSuccess = true;
        }
      } catch (e) {}

      if (!isSuccess) {
        // Fetch deposit to find user and amount
        const { data: dep } = await adminDirectClient
          .from('deposit_requests')
          .update({
            status: 'APPROVED',
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', depositId)
          .select('*')
          .single();

        if (dep) {
          isSuccess = true;
          // Credit user deposit_balance in profiles
          const { data: userProf } = await adminDirectClient
            .from('profiles')
            .select('deposit_balance, main_balance')
            .eq('auth_user_id', dep.user_id)
            .maybeSingle();

          const newDepBal = (Number(userProf?.deposit_balance) || 0) + Number(dep.amount);
          const newMainBal = (Number(userProf?.main_balance) || 0) + Number(dep.amount);

          await adminDirectClient
            .from('profiles')
            .update({
              deposit_balance: newDepBal,
              main_balance: newMainBal,
              updated_at: new Date().toISOString(),
            })
            .eq('auth_user_id', dep.user_id);
        }
      }

      if (isSuccess) {
        showBanner('success', 'Deposit approved and user balance credited.');
        setActionModal({ type: null });
        fetchData();
      } else {
        showBanner('error', 'Approval failed.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Deposit with direct DB fallback
  const handleRejectDeposit = async (depositId: string, reason: string) => {
    if (!reason.trim()) {
      showBanner('error', 'Rejection reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      let isSuccess = false;
      try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE}/admin/deposits/${depositId}/reject`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ reason: reason.trim() }),
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.success) isSuccess = true;
        }
      } catch (e) {}

      if (!isSuccess) {
        await adminDirectClient
          .from('deposit_requests')
          .update({
            status: 'REJECTED',
            rejection_reason: reason.trim(),
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', depositId);
        isSuccess = true;
      }

      if (isSuccess) {
        showBanner('success', 'Deposit request rejected.');
        setActionModal({ type: null });
        setActionReason('');
        fetchData();
      } else {
        showBanner('error', 'Rejection failed.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Conversion Request with direct DB fallback
  const handleApproveConversion = async (conversionId: string) => {
    setActionLoading(true);
    try {
      let isSuccess = false;
      try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE}/conversions/${conversionId}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'CONVERTED' }),
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.success) isSuccess = true;
        }
      } catch (e) {}

      if (!isSuccess) {
        // Direct DB update: mark CONVERTED
        const { data: conv } = await adminDirectClient
          .from('conversion_requests')
          .update({ status: 'CONVERTED', updated_at: new Date().toISOString() })
          .eq('id', conversionId)
          .select('*')
          .single();

        if (conv) {
          isSuccess = true;
          // Fetch existing user profile to accumulate convert_balance
          const { data: userProf } = await adminDirectClient
            .from('profiles')
            .select('convert_balance')
            .eq('auth_user_id', conv.user_id)
            .maybeSingle();

          const currentConvert = Number(userProf?.convert_balance) || 0;
          const addAmount = Number(conv.converted_amount || conv.to_amount || 0);

          // Credit user's convert_balance & set convert_currency and zero out converted capital/mining balance
          await adminDirectClient
            .from('profiles')
            .update({
              deposit_balance: 0,
              mining_balance: 0,
              profit_balance: 0,
              main_balance: 0,
              convert_balance: +(currentConvert + addAmount).toFixed(2),
              convert_currency: conv.target_currency || conv.to_currency || 'SGD',
              updated_at: new Date().toISOString(),
            })
            .eq('auth_user_id', conv.user_id);
        }
      }

      if (isSuccess) {
        showBanner('success', 'Conversion approved! Converted balance disbursed to user.');
        fetchData();
      } else {
        showBanner('error', 'Approval failed.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Conversion Request with direct DB fallback & full balance refund
  const handleRejectConversion = async (conversionId: string, reason?: string) => {
    setActionLoading(true);
    try {
      let isSuccess = false;
      try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE}/conversions/${conversionId}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'REJECTED', adminNotes: reason || 'Rejected by Admin' }),
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.success) isSuccess = true;
        }
      } catch (e) {}

      if (!isSuccess) {
        const { data: conv } = await adminDirectClient
          .from('conversion_requests')
          .update({
            status: 'REJECTED',
            admin_notes: reason || 'Rejected by Admin',
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversionId)
          .select('*')
          .single();

        if (conv) {
          isSuccess = true;
          // Restore held capital/mining balance to user profile
          const { data: userProf } = await adminDirectClient
            .from('profiles')
            .select('deposit_balance, main_balance')
            .eq('auth_user_id', conv.user_id)
            .maybeSingle();

          const refundAmount = Number(conv.usd_mine_amount || conv.from_amount || 0);
          const restoredDep = (Number(userProf?.deposit_balance) || 0) + refundAmount;
          const restoredMain = (Number(userProf?.main_balance) || 0) + refundAmount;

          await adminDirectClient
            .from('profiles')
            .update({
              deposit_balance: +restoredDep.toFixed(2),
              main_balance: +restoredMain.toFixed(2),
              updated_at: new Date().toISOString(),
            })
            .eq('auth_user_id', conv.user_id);
        }
      }

      if (isSuccess) {
        showBanner('success', 'Conversion request rejected and funds refunded to user.');
        fetchData();
      } else {
        showBanner('error', 'Rejection failed.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Approve KYC with direct DB fallback
  const handleApproveKyc = async (submissionId: string) => {
    setActionLoading(true);
    try {
      let isSuccess = false;
      try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE}/admin/kyc/${submissionId}/review`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ status: 'VERIFIED' }),
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.success) isSuccess = true;
        }
      } catch (e) {}

      if (!isSuccess) {
        const { data: kyc } = await adminDirectClient
          .from('kyc_submissions')
          .update({
            status: 'VERIFIED',
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', submissionId)
          .select('*')
          .single();

        if (kyc) {
          isSuccess = true;
          await adminDirectClient
            .from('profiles')
            .update({
              kyc_status: 'VERIFIED',
              updated_at: new Date().toISOString(),
            })
            .eq('auth_user_id', kyc.user_id);
        }
      }

      if (isSuccess) {
        showBanner('success', 'User KYC identity verified and approved!');
        setSelectedKyc(null);
        fetchData();
      } else {
        showBanner('error', 'Failed to approve KYC.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject KYC with direct DB fallback
  const handleRejectKyc = async (submissionId: string, reason: string) => {
    if (!reason.trim()) {
      showBanner('error', 'Rejection reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      let isSuccess = false;
      try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE}/admin/kyc/${submissionId}/review`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ status: 'REJECTED', rejectionReason: reason.trim() }),
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.success) isSuccess = true;
        }
      } catch (e) {}

      if (!isSuccess) {
        const { data: kyc } = await adminDirectClient
          .from('kyc_submissions')
          .update({
            status: 'REJECTED',
            rejection_reason: reason.trim(),
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', submissionId)
          .select('*')
          .single();

        if (kyc) {
          isSuccess = true;
          await adminDirectClient
            .from('profiles')
            .update({
              kyc_status: 'REJECTED',
              updated_at: new Date().toISOString(),
            })
            .eq('auth_user_id', kyc.user_id);
        }
      }

      if (isSuccess) {
        showBanner('success', 'User KYC identity submission rejected.');
        setSelectedKyc(null);
        fetchData();
      } else {
        showBanner('error', 'Failed to reject KYC.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Bank Withdrawal
  const handleApproveWithdrawal = async (withdrawalId: string, remark?: string) => {
    setActionLoading(true);
    try {
      let isSuccess = false;
      try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE}/admin/withdrawals/${withdrawalId}/review`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'APPROVE',
            reason: remark?.trim() || 'Approved & Dispatched by Compliance',
          }),
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.success) isSuccess = true;
        }
      } catch (e) {}

      if (!isSuccess) {
        const { data: wd, error: updErr } = await adminDirectClient
          .from('withdrawal_requests')
          .update({
            status: 'APPROVED',
            rejection_reason: remark?.trim() || null,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', withdrawalId)
          .select('*')
          .single();

        if (!updErr && wd) {
          isSuccess = true;
          // Ensure user profile balance is deducted/zeroed upon approval
          const { data: uProf } = await adminDirectClient
            .from('profiles')
            .select('*')
            .eq('auth_user_id', wd.user_id)
            .maybeSingle();

          if (uProf) {
            const isConvertSource = wd.asset?.includes('MINE') || wd.metadata?.sourceBalance === 'convert';
            if (isConvertSource) {
              const remaining = Math.max(0, Number(uProf.convert_balance || 0) - Number(wd.amount));
              await adminDirectClient
                .from('profiles')
                .update({
                  convert_balance: +remaining.toFixed(2),
                  updated_at: new Date().toISOString(),
                })
                .eq('auth_user_id', wd.user_id);
            } else {
              const remainingDep = Math.max(0, Number(uProf.deposit_balance || 0) - Number(wd.amount));
              const remainingMain = Math.max(0, Number(uProf.main_balance || 0) - Number(wd.amount));
              await adminDirectClient
                .from('profiles')
                .update({
                  deposit_balance: +remainingDep.toFixed(2),
                  main_balance: +remainingMain.toFixed(2),
                  mining_balance: 0,
                  profit_balance: 0,
                  updated_at: new Date().toISOString(),
                })
                .eq('auth_user_id', wd.user_id);
            }
          }
        }
      }

      if (isSuccess) {
        showBanner('success', 'Withdrawal approved! Wire clearance dispatched.');
        setWithdrawalModal({ isOpen: false, withdrawal: null, action: 'APPROVE', remark: '' });
        fetchData();
      } else {
        showBanner('error', 'Approval failed.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Bank Withdrawal (with automatic balance restoration)
  const handleRejectWithdrawal = async (withdrawalId: string, reason: string) => {
    if (!reason.trim()) {
      showBanner('error', 'Rejection remark / reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      let isSuccess = false;
      try {
        const headers = await getHeaders();
        const res = await fetch(`${API_BASE}/admin/withdrawals/${withdrawalId}/review`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            action: 'REJECT',
            reason: reason.trim(),
          }),
        });
        if (res.ok) {
          const json = await res.json().catch(() => null);
          if (json?.success) isSuccess = true;
        }
      } catch (e) {}

      if (!isSuccess) {
        // Direct DB fallback: update status to REJECTED
        const { data: wd, error: updErr } = await adminDirectClient
          .from('withdrawal_requests')
          .update({
            status: 'REJECTED',
            rejection_reason: reason.trim(),
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', withdrawalId)
          .select('*')
          .single();

        if (!updErr && wd) {
          isSuccess = true;
          // Restore funds to user's profile
          const { data: uProf } = await adminDirectClient
            .from('profiles')
            .select('*')
            .eq('auth_user_id', wd.user_id)
            .maybeSingle();

          if (uProf) {
            const isConvertSource = wd.asset?.includes('MINE') || wd.metadata?.sourceBalance === 'convert';
            if (isConvertSource) {
              const currentConvert = Number(uProf.convert_balance || 0);
              await adminDirectClient
                .from('profiles')
                .update({
                  convert_balance: +(currentConvert + Number(wd.amount)).toFixed(2),
                  updated_at: new Date().toISOString(),
                })
                .eq('auth_user_id', wd.user_id);
            } else {
              const currentDep = Number(uProf.deposit_balance || 0);
              const currentMain = Number(uProf.main_balance || 0);
              await adminDirectClient
                .from('profiles')
                .update({
                  deposit_balance: +(currentDep + Number(wd.amount)).toFixed(2),
                  main_balance: +(currentMain + Number(wd.amount)).toFixed(2),
                  updated_at: new Date().toISOString(),
                })
                .eq('auth_user_id', wd.user_id);
            }
          }
        }
      }

      if (isSuccess) {
        showBanner('success', 'Withdrawal rejected and user balance automatically restored!');
        setWithdrawalModal({ isOpen: false, withdrawal: null, action: 'APPROVE', remark: '' });
        fetchData();
      } else {
        showBanner('error', 'Rejection failed.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };


  if (!isOpen) return null;

  const isSuperAdmin = Boolean(
    user && (role === 'admin' || role === 'moderator' || user.email?.toLowerCase() === 'admin@quibandsglobal.com')
  );

  if (!isSuperAdmin) {
    return null;
  }


  // Search filter
  const filteredUsers = (users || []).filter((u) => {
    if (!u) return false;
    const email = u.email || '';
    const name = u.full_name || '';
    const phone = u.phone_number || '';
    const username = u.username || '';
    const q = searchQuery.toLowerCase();
    const matchesSearch = email.toLowerCase().includes(q) || name.toLowerCase().includes(q) || phone.toLowerCase().includes(q) || username.toLowerCase().includes(q);
    const status = u.account_status || 'active';
    if (statusFilter === 'active') return matchesSearch && status === 'active' && !u.is_flagged;
    if (statusFilter === 'suspended') return matchesSearch && status === 'suspended';
    if (statusFilter === 'flagged') return matchesSearch && (u.is_flagged || status === 'flagged');
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-7xl h-[94vh] bg-dark-950 border border-gold-500/30 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3.5 border-b border-white/10 bg-dark-900 gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/30 shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
                <h2 className="text-sm sm:text-base lg:text-xl font-bold text-white font-mono tracking-tight truncate">
                  Admin Hub
                </h2>
                <span className="px-1.5 py-0.5 text-[9px] sm:text-xs font-mono font-bold bg-gold-500 text-dark-950 rounded-full shrink-0">
                  SUPERADMIN
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate hidden sm:block">
                Financial Balances, Miner Management, Gas Fee Approvals & System Settings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 sm:px-3 rounded-lg bg-gold-500/15 border border-gold-500/40 hover:bg-gold-500/25 text-gold-400 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm shrink-0"
              title="Return to User Dashboard"
            >
              <ArrowLeft className="w-4 h-4 text-gold-400" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </button>
            <button
              onClick={() => setTestConsoleOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-dark-850 border border-gold-500/30 hover:border-gold-400 text-gold-400 hover:text-white text-xs font-mono flex items-center gap-1.5 transition active:scale-95 shadow-sm shrink-0"
              title="Phase 1-4 Integration & Diagnostics Console"
            >
              <Terminal className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden md:inline">Test Console</span>
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-lg bg-dark-850 border border-white/10 text-slate-300 hover:text-white hover:border-gold-500/40 transition shrink-0"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-dark-850 border border-white/10 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 transition shrink-0"
              title="Close Admin Hub"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>


        {/* Global Toast Banner */}
        {message && (
          <div className={`px-6 py-2.5 text-xs font-medium flex items-center gap-2 border-b ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {/* Mobile Tool Selector Bar (Visible on Mobile Only) */}
        <div className="lg:hidden px-4 py-2.5 bg-dark-900 border-b border-white/10 flex items-center justify-between z-30 notranslate" translate="no">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-slate-400 font-mono">Module:</span>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-dark-950 border border-gold-500/30 text-white font-bold text-xs font-mono truncate">
              {activeTab === 'users' && <Users className="w-3.5 h-3.5 text-gold-400" />}
              {activeTab === 'deposits' && <ArrowDownCircle className="w-3.5 h-3.5 text-gold-400" />}
              {activeTab === 'conversions' && <Coins className="w-3.5 h-3.5 text-emerald-400" />}
              {activeTab === 'withdrawals' && <ArrowUpCircle className="w-3.5 h-3.5 text-rose-400" />}
              {activeTab === 'kyc' && <FileCheck className="w-3.5 h-3.5 text-emerald-400" />}
              {activeTab === 'support' && <MessageSquare className="w-3.5 h-3.5 text-gold-400" />}
              {activeTab === 'settings' && <Sliders className="w-3.5 h-3.5 text-amber-400" />}
              {activeTab === 'security' && <Radio className="w-3.5 h-3.5 text-emerald-400" />}
              {activeTab === 'treasury' && <WalletCards className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="truncate">
                {activeTab === 'users' && `User Accounts (${users.length})`}
                {activeTab === 'deposits' && `Deposits (${adminDeposits.length})`}
                {activeTab === 'conversions' && `Conversions (${conversions.length})`}
                {activeTab === 'withdrawals' && `Withdrawals (${adminWithdrawals.length})`}
                {activeTab === 'kyc' && `KYC (${kycSubmissions.length})`}
                {activeTab === 'support' && 'Live Support Desk'}
                {activeTab === 'settings' && 'System Settings'}
                {activeTab === 'security' && `Telemetry (${securityLogs.length})`}
                {activeTab === 'treasury' && `Deposit Addresses (${depositAddresses.length})`}
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
            className="px-3 py-1.5 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/40 text-gold-300 text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm active:scale-95 transition"
          >
            <span>{mobileToolsOpen ? '✕ Close' : '⚙ Switch Tool ▾'}</span>
          </button>
        </div>

        {/* Mobile Tools Overlay Drawer (Visible when toggled on Mobile) */}
        {mobileToolsOpen && (
          <div className="lg:hidden absolute inset-x-0 top-[110px] bottom-0 z-40 bg-[#060a12] p-4 overflow-y-auto overscroll-contain space-y-2 border-b border-white/10 shadow-2xl animate-fadeIn notranslate" translate="no">
            <div className="text-xs font-mono text-gold-400 font-bold uppercase tracking-wider pb-2 border-b border-white/10 mb-3 flex items-center justify-between">
              <span>Admin Modules</span>
              <span className="text-[10px] text-slate-400">Tap to open module</span>
            </div>

            <button
              onClick={() => { setActiveTab('users'); setSelectedUserId(null); setMobileToolsOpen(false); }}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition active:scale-[0.98] ${
                activeTab === 'users' ? 'bg-gold-500/25 text-white border-2 border-gold-400 font-bold shadow-md' : 'text-slate-300 bg-[#0c121e] border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-gold-400" />
                <span className="font-semibold">User Accounts Directory</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">{users.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('deposits'); setSelectedUserId(null); setMobileToolsOpen(false); }}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition active:scale-[0.98] ${
                activeTab === 'deposits' ? 'bg-gold-500/25 text-white border-2 border-gold-400 font-bold shadow-md' : 'text-slate-300 bg-[#0c121e] border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <ArrowDownCircle className="w-4 h-4 text-gold-400" />
                <span className="font-semibold">Deposit Requests</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">{adminDeposits.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('conversions'); setSelectedUserId(null); setMobileToolsOpen(false); }}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition active:scale-[0.98] ${
                activeTab === 'conversions' ? 'bg-gold-500/25 text-white border-2 border-gold-400 font-bold shadow-md' : 'text-slate-300 bg-[#0c121e] border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Coins className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Mine Conversions</span>
              </div>
              {conversions.filter(c => c.status === 'PENDING').length > 0 ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-dark-950 font-bold font-mono animate-pulse">
                  {conversions.filter(c => c.status === 'PENDING').length} PENDING
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">{conversions.length}</span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('withdrawals'); setSelectedUserId(null); setMobileToolsOpen(false); }}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition active:scale-[0.98] ${
                activeTab === 'withdrawals' ? 'bg-gold-500/25 text-white border-2 border-gold-400 font-bold shadow-md' : 'text-slate-300 bg-[#0c121e] border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <ArrowUpCircle className="w-4 h-4 text-rose-400" />
                <span className="font-semibold">Withdrawals & Gas Fees</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">{adminWithdrawals.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('kyc'); setSelectedUserId(null); setMobileToolsOpen(false); }}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition active:scale-[0.98] ${
                activeTab === 'kyc' ? 'bg-emerald-500/25 text-white border-2 border-emerald-400 font-bold shadow-md' : 'text-slate-300 bg-[#0c121e] border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">KYC Verifications</span>
              </div>
              {kycSubmissions.filter(k => k.status === 'PENDING').length > 0 ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-dark-950 font-bold font-mono animate-pulse">
                  {kycSubmissions.filter(k => k.status === 'PENDING').length} PENDING
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">{kycSubmissions.length}</span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('support'); setSelectedUserId(null); setMobileToolsOpen(false); }}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition active:scale-[0.98] ${
                activeTab === 'support' ? 'bg-gradient-to-r from-gold-400/20 to-amber-500/20 text-gold-300 border-2 border-gold-400 font-bold shadow-md' : 'text-slate-300 bg-[#0c121e] border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-gold-400" />
                <span className="font-semibold">Live Support Desk</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold font-mono">LIVE</span>
            </button>

            <button
              onClick={() => { setActiveTab('settings'); setSelectedUserId(null); setMobileToolsOpen(false); }}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition active:scale-[0.98] ${
                activeTab === 'settings' ? 'bg-gold-500/25 text-white border-2 border-gold-400 font-bold shadow-md' : 'text-slate-300 bg-[#0c121e] border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">System Treasury Settings</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab('security'); setSelectedUserId(null); setMobileToolsOpen(false); }}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition active:scale-[0.98] ${
                activeTab === 'security' ? 'bg-gold-500/25 text-white border-2 border-gold-400 font-bold shadow-md' : 'text-slate-300 bg-[#0c121e] border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Login Telemetry</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">{securityLogs.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('treasury'); setSelectedUserId(null); setMobileToolsOpen(false); }}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition active:scale-[0.98] ${
                activeTab === 'treasury' ? 'bg-gold-500/25 text-white border-2 border-gold-400 font-bold shadow-md' : 'text-slate-300 bg-[#0c121e] border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <WalletCards className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold">Deposit Addresses</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">{depositAddresses.length}</span>
            </button>

            <button
              onClick={() => { setTestConsoleOpen(true); setMobileToolsOpen(false); }}
              className="w-full flex items-center justify-between p-3.5 rounded-xl text-sm font-medium transition active:scale-[0.98] text-gold-300 bg-gold-500/10 border border-gold-500/30 hover:bg-gold-500/20"
            >
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-gold-400" />
                <span className="font-semibold">Phase 1-4 Test Console</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 border border-gold-400/30 font-mono font-bold">DEV</span>
            </button>

            <div className="pt-3 border-t border-white/10 mt-4">
              <button
                onClick={() => setMobileToolsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-dark-850 text-slate-300 hover:text-white text-xs font-mono border border-white/10"
              >
                Close Menu & View Workspace
              </button>
            </div>
          </div>
        )}

        {/* Main Body with Sidebar & Content */}
        <div className="flex flex-1 overflow-hidden h-full min-h-0 w-full">

          
          {/* Navigation Sidebar (Visible on Desktop Only) */}
          <div className="hidden lg:flex w-64 border-r border-white/10 bg-dark-900/60 flex-col justify-between p-4 shrink-0">
            <div className="space-y-1.5">
              <button
                onClick={() => handleSelectTab('users')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === 'users'
                    ? 'bg-gold-500/20 text-white border border-gold-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gold-400" />
                  <span>User Accounts</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                  {users.length}
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('deposits')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === 'deposits'
                    ? 'bg-gold-500/20 text-white border border-gold-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ArrowDownCircle className="w-4 h-4 text-gold-400" />
                  <span>Deposit Requests</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">
                  {adminDeposits.length}
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('conversions')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === 'conversions'
                    ? 'bg-gold-500/20 text-white border border-gold-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span>Mine Conversions</span>
                </div>
                {conversions.filter(c => c.status === 'PENDING').length > 0 ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-dark-950 font-bold font-mono animate-pulse">
                    {conversions.filter(c => c.status === 'PENDING').length}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">
                    {conversions.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleSelectTab('withdrawals')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === 'withdrawals'
                    ? 'bg-gold-500/20 text-white border border-gold-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ArrowUpCircle className="w-4 h-4 text-rose-400" />
                  <span>Withdrawals & Gas</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">
                  {adminWithdrawals.length}
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('kyc')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === 'kyc'
                    ? 'bg-emerald-500/20 text-white border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>KYC Verifications</span>
                </div>
                {kycSubmissions.filter(k => k.status === 'PENDING').length > 0 ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-dark-950 font-bold font-mono animate-pulse">
                    {kycSubmissions.filter(k => k.status === 'PENDING').length}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">
                    {kycSubmissions.length}
                  </span>
                )}
              </button>

              {/* LIVE SUPPORT DESK */}
              <button
                onClick={() => handleSelectTab('support')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === 'support'
                    ? 'bg-gradient-to-r from-gold-400/20 to-amber-500/20 text-gold-300 border border-gold-400/40 shadow-gold-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-gold-400" />
                  <span>Live Support Desk</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold font-mono">
                  LIVE
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('settings')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === 'settings'
                    ? 'bg-gold-500/20 text-white border border-gold-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Treasury Settings</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectTab('security')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === 'security'
                    ? 'bg-gold-500/20 text-white border border-gold-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Login Telemetry</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">
                  {securityLogs.length}
                </span>
              </button>

              <button
                onClick={() => handleSelectTab('treasury')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === 'treasury'
                    ? 'bg-gold-500/20 text-white border border-gold-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <WalletCards className="w-4 h-4 text-cyan-400" />
                  <span>Deposit Addresses</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-mono">
                  {depositAddresses.length}
                </span>
              </button>

              <button
                onClick={() => setTestConsoleOpen(true)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition text-gold-300 bg-gold-500/10 border border-gold-500/30 hover:bg-gold-500/20"
              >
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-gold-400" />
                  <span>Phase 1-4 Console</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 border border-gold-400/30 font-mono font-bold">
                  DEV
                </span>
              </button>
            </div>

            {/* Admin Session Info */}
            <div className="pt-4 border-t border-white/10 text-[11px] font-mono text-slate-400">
              <div className="flex items-center justify-between mb-1">
                <span>Role:</span>
                <span className="text-gold-400 font-bold uppercase">{profile?.role || 'SUPER_ADMIN'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Account:</span>
                <span className="text-white truncate max-w-[110px]">{profile?.email}</span>
              </div>
            </div>
          </div>

          {/* Right Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-dark-900/30 w-full min-w-0 h-full min-h-0">


            
            {/* TAB 1: USERS DIRECTORY */}
            {activeTab === 'users' && (
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col p-3 sm:p-6 overflow-hidden">

                  
                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div className="relative flex-1 max-w-md w-full">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by email, name or username..."
                        className="w-full pl-9 pr-4 py-2 bg-dark-950 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-gold-500"
                      />
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="flex-1 overflow-y-auto border border-white/10 rounded-xl bg-dark-950/80 font-mono text-xs">
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-dark-900 border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="px-4 py-3">User Profile</th>
                          <th className="px-4 py-3">Credentials / Key</th>
                          <th className="px-4 py-3">Deposit (Capital)</th>
                          <th className="px-4 py-3">Mining (Profit)</th>
                          <th className="px-4 py-3">Main (Total)</th>
                          <th className="px-4 py-3">Convert Asset</th>
                          <th className="px-4 py-3">Referrals</th>
                          <th className="px-4 py-3">Tier</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center py-10 text-slate-500 font-sans">
                              No user accounts found matching current filters.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-white/[0.02] transition">
                              <td className="px-4 py-3 font-sans">
                                <div className="font-bold text-white text-xs">{u.full_name || 'Trader'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                                {u.phone_number && (
                                  <div className="text-[10px] text-amber-300 font-mono flex items-center gap-1 mt-0.5">
                                    <Smartphone className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span>{u.phone_number}</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 font-mono">
                                <div className="flex items-center gap-1.5">
                                  {u.temp_password ? (
                                    <span className="text-amber-300 font-bold text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                                      {u.temp_password}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 text-xs tracking-widest">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</span>
                                  )}
                                  <button
                                    onClick={() => openPassModal(u)}
                                    title="View / Reset Password"
                                    className="p-1 rounded hover:bg-dark-800 text-slate-400 hover:text-gold-400 transition"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-bold text-cyan-400">
                                ${(u.deposit_balance !== undefined ? u.deposit_balance : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 font-bold text-emerald-400">
                                ${(u.mining_balance !== undefined ? u.mining_balance : (u.profit_balance || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 font-bold text-gold-400">
                                ${(u.main_balance !== undefined ? u.main_balance : ((u.deposit_balance || 0) + (u.mining_balance || 0) + (u.profit_balance || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 font-bold text-teal-300">
                                {(u.convert_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {u.convert_currency || 'SGD'}
                              </td>
                              <td className="px-4 py-3 font-mono">
                                <span className="text-gold-400 font-bold">{u.referral_code || 'QUIB-ACTIVE'}</span>
                                <span className="block text-[10px] text-slate-400">{u.referral_count || 0} Affiliates</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                                  {u.account_tier || 'BASIC'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* STOP / RESUME MINER TOGGLE */}
                                  <button
                                    onClick={() => handleToggleMiner(u)}
                                    className={`px-2 py-1 rounded-lg border text-[10px] font-semibold font-sans transition flex items-center gap-1 ${
                                      u.miner_status === 'stopped'
                                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/40'
                                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                                    }`}
                                    title={u.miner_status === 'stopped' ? 'Miner is STOPPED - Click to Resume' : 'Miner is ACTIVE - Click to Stop/Pause'}
                                  >
                                    {u.miner_status === 'stopped' ? (
                                      <>
                                        <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                                        <span>Resume Miner</span>
                                      </>
                                    ) : (
                                      <>
                                        <Square className="w-3 h-3 text-rose-400 fill-rose-400" />
                                        <span>Stop Miner</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => openFinancialEditor(u)}
                                    className="px-2.5 py-1 rounded-lg bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 border border-gold-500/40 text-[10px] font-semibold font-sans transition flex items-center gap-1"
                                    title="Edit Balances & Remarks"
                                  >
                                    <DollarSign className="w-3 h-3" />
                                    <span>Balances</span>
                                  </button>
                                  
                                  <button
                                    onClick={() => handleForceLogout(u)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition"
                                    title="Force Logout Active Sessions"
                                  >
                                    <LogOut className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleSendResetEmail(u)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition"
                                    title="Send Password Reset Email"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleTerminateAccount(u)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                                    title="Terminate & Purge Account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                     onClick={() => setBankModal({
                                       isOpen: true,
                                       user: u,
                                       bankDetails: u.bank_details,
                                       title: `${u.full_name || u.email}'s Bank Account`
                                     })}
                                     className={`px-2 py-1 rounded-lg border text-[10px] font-semibold font-sans transition flex items-center gap-1 ${
                                       u.bank_details?.account_number
                                         ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-sm'
                                         : 'bg-dark-850 text-slate-400 border-white/10 hover:bg-white/10'
                                     }`}
                                     title="Inspect User Full Bank Details"
                                   >
                                     <Building2 className="w-3 h-3" />
                                     <span>{u.bank_details?.account_number ? 'Bank ✓' : 'Bank'}</span>
                                   </button>

                                  <button
                                    onClick={() => loadUserDossier(u.auth_user_id)}
                                    className="px-2 py-1 rounded-lg bg-dark-850 hover:bg-white/10 text-slate-300 border border-white/10 text-[10px] font-semibold font-sans transition"
                                  >
                                    Dossier
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>

                {/* User Dossier Drawer */}
                {selectedUserId && userDossier && (
                  <div className="w-full lg:w-96 border-l border-white/10 bg-dark-950 p-6 overflow-y-auto flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-gold-400" />
                          <h3 className="font-bold text-white text-base font-mono">User Dossier</h3>
                        </div>
                        <button onClick={() => setSelectedUserId(null)} className="text-slate-400 hover:text-white">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="p-4 rounded-xl bg-dark-900 border border-white/10 space-y-3 font-mono text-xs">
                        <div>
                          <div className="text-slate-400 text-[10px] uppercase">Full Name & Contact</div>
                          <div className="text-white font-bold font-sans text-sm">{userDossier.profile?.full_name || 'N/A'}</div>
                          <div className="text-slate-300 text-xs">{userDossier.profile?.email}</div>
                          {userDossier.profile?.phone_number && (
                            <div className="text-amber-300 text-xs font-mono flex items-center gap-1.5 mt-1 bg-dark-950 p-1.5 rounded-lg border border-amber-500/20">
                              <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{userDossier.profile.phone_number}</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                          <div>
                            <div className="text-slate-400 text-[10px] uppercase">Tier</div>
                            <div className="font-bold text-amber-400">{userDossier.profile?.account_tier || 'BASIC'}</div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[10px] uppercase">Limit</div>
                            <div className="text-slate-200">${(userDossier.profile?.receive_limit || 9000).toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Saved Bank Account Card in Dossier */}
                        {userDossier.profile?.bank_details && userDossier.profile.bank_details.account_number && (
                          <div className="pt-2 border-t border-white/5 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="text-emerald-400 text-[10px] uppercase font-bold flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                <span>Saved Bank Account</span>
                              </div>
                              <button
                                onClick={() => setBankModal({
                                  isOpen: true,
                                  user: userDossier.profile,
                                  bankDetails: userDossier.profile.bank_details,
                                  title: `${userDossier.profile.full_name || userDossier.profile.email}'s Bank Account`
                                })}
                                className="text-[10px] text-emerald-300 hover:text-emerald-200 underline font-sans"
                              >
                                View Full
                              </button>
                            </div>
                            <div className="p-2.5 rounded-lg bg-dark-950 border border-emerald-500/30 text-[11px] text-slate-300 space-y-1">
                              <div className="font-bold text-white flex items-center justify-between">
                                <span>{userDossier.profile.bank_details.bank_name}</span>
                                <span className="text-[10px] text-emerald-400 font-mono font-bold">{userDossier.profile.bank_details.currency || 'SGD'}</span>
                              </div>
                              <div>Holder: <span className="text-slate-200 font-semibold">{userDossier.profile.bank_details.account_holder}</span></div>
                              <div className="flex items-center justify-between bg-dark-900 px-2 py-1 rounded border border-white/5">
                                <span>Account: <strong className="text-emerald-300 font-mono">{userDossier.profile.bank_details.account_number}</strong></span>
                                <button
                                  onClick={() => copyToClipboard(userDossier.profile.bank_details?.account_number || '', 'dossier-acct')}
                                  className="text-slate-400 hover:text-white"
                                  title="Copy Account Number"
                                >
                                  {copiedId === 'dossier-acct' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                              {userDossier.profile.bank_details.swift_routing && (
                                <div>SWIFT: <span className="text-gold-400 font-mono font-bold">{userDossier.profile.bank_details.swift_routing}</span> ({userDossier.profile.bank_details.bank_country || 'Global'})</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Cloud Miner Control Card in Dossier */}
                        <div className="pt-2 border-t border-white/5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="text-cyan-400 text-[10px] uppercase font-bold flex items-center gap-1">
                              <Cpu className="w-3.5 h-3.5" />
                              <span>Cloud Miner Control</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              userDossier.profile?.miner_status === 'stopped'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {userDossier.profile?.miner_status === 'stopped' ? 'STOPPED' : 'ACTIVE (HASHING)'}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const u = users.find((x) => x.auth_user_id === selectedUserId) || userDossier.profile;
                              if (u) handleToggleMiner(u);
                            }}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                              userDossier.profile?.miner_status === 'stopped'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                            }`}
                          >
                            {userDossier.profile?.miner_status === 'stopped' ? (
                              <>
                                <Play className="w-3.5 h-3.5 fill-emerald-300" />
                                <span>Resume / Activate User Miner</span>
                              </>
                            ) : (
                              <>
                                <Square className="w-3.5 h-3.5 fill-rose-300" />
                                <span>Stop / Pause User Miner</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 space-y-2">
                        <button
                          onClick={() => {
                            const u = users.find((x) => x.auth_user_id === selectedUserId);
                            if (u) openFinancialEditor(u);
                          }}
                          className="w-full py-2.5 bg-gold-500 text-dark-950 font-bold rounded-xl text-xs hover:bg-gold-400 transition shadow-md flex items-center justify-center gap-1.5"
                        >
                          <DollarSign className="w-4 h-4" />
                          Edit Balances & Limits
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setActionModal({ type: 'suspend', userId: selectedUserId })}
                            className="py-2 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-xl text-xs font-semibold hover:bg-rose-500/30 transition"
                          >
                            Suspend
                          </button>
                          <button
                            onClick={() => setActionModal({ type: 'flag', userId: selectedUserId })}
                            className="py-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl text-xs font-semibold hover:bg-amber-500/30 transition"
                          >
                            Flag Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DEPOSITS */}
            {activeTab === 'deposits' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <ArrowDownCircle className="w-5 h-5 text-gold-400" />
                    Institutional Deposit Requests
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto border border-white/10 rounded-xl bg-dark-950/80 font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-dark-900 border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Asset</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Tx Hash</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {adminDeposits.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-10 text-slate-500">No deposit records.</td></tr>
                      ) : (
                        adminDeposits.map((d) => (
                          <tr key={d.id} className="hover:bg-white/[0.02] transition">
                            <td className="px-4 py-3 text-slate-400">{new Date(d.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 font-sans font-bold text-white">{d.user_profile?.email || d.user_id.slice(0, 10)}</td>
                            <td className="px-4 py-3 font-bold text-gold-400">{d.asset} ({d.network})</td>
                            <td className="px-4 py-3 font-bold text-emerald-400">+{d.amount}</td>
                            <td className="px-4 py-3 text-slate-400 truncate max-w-xs">{d.transaction_hash}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                d.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                                d.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>{d.status}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {d.status === 'PENDING' && (
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => handleApproveDeposit(d.id)} className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-semibold">Approve</button>
                                  <button onClick={() => setActionModal({ type: 'reject-deposit', deposit: d })} className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg text-xs font-semibold">Reject</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: MINE CONVERSIONS APPROVALS */}
            {activeTab === 'conversions' && (
              <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                      <Coins className="w-5 h-5 text-emerald-400" />
                      Mine Asset Conversions & 20% Fee Clearances
                    </h3>
                    <p className="text-xs text-slate-400">
                      Review USD Mine to Local Mine conversions. Approving automatically credits the user's Convert Balance.
                    </p>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center gap-1.5 p-1 bg-dark-950 border border-white/10 rounded-xl text-xs font-mono">
                    {(['all', 'PENDING', 'CONVERTED', 'REJECTED'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setConversionFilter(filter)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition uppercase ${
                          conversionFilter === filter
                            ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {filter} {filter !== 'all' && `(${conversions.filter((c) => c.status === filter).length})`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto border border-white/10 rounded-xl bg-dark-950/80 font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-dark-900 border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">From (USD Mine)</th>
                        <th className="px-4 py-3">Target Currency</th>
                        <th className="px-4 py-3">Gross Output</th>
                        <th className="px-4 py-3">20% BNB Fee</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {conversions
                        .filter((c) => conversionFilter === 'all' || c.status === conversionFilter)
                        .length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-10 text-slate-500 font-sans">
                            No conversion requests found.
                          </td>
                        </tr>
                      ) : (
                        conversions
                          .filter((c) => conversionFilter === 'all' || c.status === conversionFilter)
                          .map((c) => (
                            <tr key={c.id} className="hover:bg-white/[0.02] transition">
                              <td className="px-4 py-3 text-slate-400">
                                {new Date(c.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 font-sans font-bold text-white">
                                {c.user_email || (c as any).user_profile?.email || c.user_id.slice(0, 10)}
                              </td>
                              <td className="px-4 py-3 font-bold text-white">
                                ${Number(c.usd_mine_amount || c.from_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                              </td>
                              <td className="px-4 py-3 font-bold text-emerald-400">
                                {c.target_currency} Mine
                              </td>
                              <td className="px-4 py-3 font-bold text-emerald-400">
                                {Number(c.converted_amount || c.to_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {c.target_currency}
                              </td>
                              <td className="px-4 py-3 font-mono">
                                <div className="text-amber-400 font-bold">
                                  {(c.conversion_fee_bnb !== undefined ? c.conversion_fee_bnb : c.fee_amount_bnb) ? `${c.conversion_fee_bnb ?? c.fee_amount_bnb} BNB` : `$${c.conversion_fee_usd ?? c.fee_amount_usd ?? ((c.usd_mine_amount || 0) * 0.2)}`}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  20% Fee (${Number(c.conversion_fee_usd ?? c.fee_amount_usd ?? ((c.usd_mine_amount || 0) * 0.2)).toFixed(2)})
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    c.status === 'CONVERTED'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : c.status === 'REJECTED'
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                                  }`}
                                >
                                  {c.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {c.status === 'PENDING' ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleApproveConversion(c.id)}
                                      disabled={actionLoading}
                                      className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold transition disabled:opacity-50"
                                    >
                                      Approve & Credit
                                    </button>
                                    <button
                                      onClick={() => {
                                        const reason = prompt('Rejection reason (optional):');
                                        handleRejectConversion(c.id, reason || undefined);
                                      }}
                                      disabled={actionLoading}
                                      className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-lg text-xs font-bold transition disabled:opacity-50"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-500">
                                    {c.status === 'CONVERTED' ? 'Approved & Credited' : 'Rejected'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: WITHDRAWALS & BANK CLEARANCE */}
            {activeTab === 'withdrawals' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                      <ArrowUpCircle className="w-5 h-5 text-rose-400" />
                      Institutional Direct Bank Withdrawals &amp; Clearance
                    </h3>
                    <p className="text-xs text-slate-400">
                      Approve or reject bank withdrawals with custom compliance remarks (rejection automatically refunds and restores user balance)
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto border border-white/10 rounded-xl bg-dark-950/80 font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-dark-900 border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">User Account</th>
                        <th className="px-4 py-3">Payout Amount</th>
                        <th className="px-4 py-3">Beneficiary Bank Details</th>
                        <th className="px-4 py-3">HBC / VBC Code</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Compliance Remark</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {adminWithdrawals.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-10 text-slate-500 font-sans">No withdrawal requests found.</td></tr>
                      ) : (
                        adminWithdrawals.map((w) => {
                          const isAppr = w.status === 'APPROVED';
                          const isRej = w.status === 'REJECTED';
                          const isPend = w.status === 'PENDING' || (!isAppr && !isRej);

                          return (
                            <tr key={w.id} className="hover:bg-white/[0.02] transition">
                              <td className="px-4 py-3 text-slate-400">{new Date(w.created_at).toLocaleDateString()}</td>
                              <td className="px-4 py-3 font-sans font-bold text-white">
                                <div>{w.user_profile?.full_name || 'Trader'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{w.user_profile?.email || w.user_id.slice(0, 10)}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-bold text-white text-sm">{w.amount} {w.asset}</span>
                                <span className="block text-[10px] text-emerald-400 font-bold">100% MAX Disbursed</span>
                              </td>
                              <td className="px-4 py-3 text-slate-300 max-w-xs">
                                <div className="flex items-center justify-between">
                                  <div className="font-bold text-white truncate max-w-[150px]">{w.bank_details?.bank_name || 'Bank Transfer'}</div>
                                  {w.bank_details && w.bank_details.account_number && (
                                    <button
                                      onClick={() => setBankModal({
                                        isOpen: true,
                                        user: null,
                                        bankDetails: w.bank_details,
                                        title: `Withdrawal Wire Details: ${w.user_profile?.full_name || 'Trader'} (${w.amount} ${w.asset})`
                                      })}
                                      className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-sans font-bold flex items-center gap-1 transition"
                                      title="Inspect Full Wire Information"
                                    >
                                      <Building2 className="w-2.5 h-2.5" />
                                      <span>Full Bank</span>
                                    </button>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {w.bank_details?.account_holder ? `${w.bank_details.account_holder} • ${w.bank_details.account_number}` : w.destination_wallet_address}
                                </div>
                                {w.bank_details?.swift_routing && (
                                  <div className="text-[9px] text-gold-400/80">SWIFT: {w.bank_details.swift_routing}</div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-amber-300 font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                                  {w.hbc_vbc_code || 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                                  isAppr ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                                  isRej ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 
                                  'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                                }`}>
                                  {w.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-300 font-sans max-w-xs truncate" title={w.rejection_reason || ''}>
                                {w.rejection_reason ? (
                                  <span className="text-slate-200">{w.rejection_reason}</span>
                                ) : (
                                  <span className="text-slate-600 italic">No remark added</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isPend ? (
                                  <div className="flex justify-end gap-1.5 font-sans">
                                    <button
                                      onClick={() => setWithdrawalModal({
                                        isOpen: true,
                                        withdrawal: w,
                                        action: 'APPROVE',
                                        remark: 'Approved & Dispatched to Bank',
                                      })}
                                      className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 rounded-lg text-xs font-bold transition shadow-sm"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => setWithdrawalModal({
                                        isOpen: true,
                                        withdrawal: w,
                                        action: 'REJECT',
                                        remark: 'Wrong HBC or VBC code',
                                      })}
                                      className="px-3 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 rounded-lg text-xs font-bold transition shadow-sm"
                                    >
                                      Reject (Refund)
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-500 text-[11px] font-mono">Reviewed</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3.5: KYC COMPLIANCE & CREDENTIALS REVIEW */}
            {activeTab === 'kyc' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-400" />
                      KYC Identity Compliance & Credential Auditing
                    </h3>
                    <p className="text-xs text-slate-400">Inspect user legal credentials, national IDs, passports, and selfie proof-of-life photographs</p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-dark-900 p-1 rounded-xl border border-white/10 text-xs font-mono">
                    {(['all', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setKycFilter(filter)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition ${
                          kycFilter === filter
                            ? 'bg-gold-500 text-dark-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {filter.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto border border-white/10 rounded-xl bg-dark-950/80 font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-dark-900 border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Submitted</th>
                        <th className="px-4 py-3">Applicant Name</th>
                        <th className="px-4 py-3">Account Email</th>
                        <th className="px-4 py-3">Document</th>
                        <th className="px-4 py-3">Country</th>
                        <th className="px-4 py-3">Images</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {kycSubmissions.filter((k) => kycFilter === 'all' || k.status === kycFilter).length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-10 text-slate-500">
                            No KYC submissions matching filter.
                          </td>
                        </tr>
                      ) : (
                        kycSubmissions
                          .filter((k) => kycFilter === 'all' || k.status === kycFilter)
                          .map((k) => (
                            <tr key={k.id} className="hover:bg-white/[0.02] transition">
                              <td className="px-4 py-3 text-slate-400">
                                {new Date(k.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 font-sans font-bold text-white">
                                {k.first_name} {k.last_name}
                              </td>
                              <td className="px-4 py-3 text-slate-300 font-mono">
                                {k.user_profile?.email || k.user_id.slice(0, 10)}
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-bold text-gold-400">{k.document_type}</span>
                                <span className="block text-[10px] text-slate-400 font-mono">{k.document_number}</span>
                              </td>
                              <td className="px-4 py-3 text-slate-300">{k.country}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  {k.id_front_url && (
                                    <button
                                      onClick={() => setLightboxImage({ url: k.id_front_url, title: `Front ID - ${k.first_name} ${k.last_name}` })}
                                      className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 hover:border-gold-400 transition"
                                      title="View Front ID"
                                    >
                                      <img src={k.id_front_url} alt="Front" className="w-full h-full object-cover" />
                                    </button>
                                  )}
                                  {k.id_back_url && (
                                    <button
                                      onClick={() => setLightboxImage({ url: k.id_back_url!, title: `Back ID - ${k.first_name} ${k.last_name}` })}
                                      className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 hover:border-gold-400 transition"
                                      title="View Back ID"
                                    >
                                      <img src={k.id_back_url} alt="Back" className="w-full h-full object-cover" />
                                    </button>
                                  )}
                                  {k.selfie_url && (
                                    <button
                                      onClick={() => setLightboxImage({ url: k.selfie_url, title: `Selfie Photo - ${k.first_name} ${k.last_name}` })}
                                      className="w-7 h-7 rounded-lg overflow-hidden border border-emerald-500/50 hover:border-emerald-400 transition"
                                      title="View Selfie Photo"
                                    >
                                      <img src={k.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  k.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                  k.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 
                                  'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                                }`}>
                                  {k.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => setSelectedKyc(k)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-600 hover:to-amber-700 text-dark-950 font-bold rounded-lg text-xs transition shadow-sm flex items-center gap-1.5 ml-auto"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Review Credentials</span>
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: LIVE SUPPORT CHAT DESK */}
            {activeTab === 'support' && (
              <div className="flex-1 flex flex-col h-full min-h-0 w-full overflow-hidden">
                <AdminSupportChatTab getHeaders={getHeaders} />
              </div>
            )}



            {/* TAB 4: SYSTEM SETTINGS (Gas Fee Address, Upgrade Address, Receive Limit) */}
            {activeTab === 'settings' && (

              <div className="p-8 max-w-3xl overflow-y-auto space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-400" />
                    Treasury & Platform System Settings
                  </h3>
                  <p className="text-xs text-slate-400">Configure Gas Fee payment destination, Account Upgrade payment address, and Receive Limits</p>
                </div>

                <form onSubmit={handleSaveSystemSettings} className="space-y-5 bg-dark-950 p-6 rounded-2xl border border-white/10">
                  
                  {/* Gas Fee Address */}
                  <div className="space-y-2 p-4 bg-dark-900/60 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        20% Gas Fee Deposit Address
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">Disbursement Fee Destination</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        value={gasFeeAddress}
                        onChange={(e) => setGasFeeAddress(e.target.value)}
                        placeholder="Enter TRON / ERC20 Gas Fee Address"
                        className="sm:col-span-3 p-2.5 bg-dark-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                        required
                      />
                      <input
                        type="text"
                        value={gasFeeNetwork}
                        onChange={(e) => setGasFeeNetwork(e.target.value.toUpperCase())}
                        placeholder="TRC20"
                        className="p-2.5 bg-dark-950 border border-slate-700 rounded-xl text-xs text-white font-mono uppercase focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Tier Upgrade Address */}
                  <div className="space-y-2 p-4 bg-dark-900/60 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        Account Upgrade Payment Treasury Address
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">Bronze, Gold, Premium Upgrades</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        value={tierUpgradeAddress}
                        onChange={(e) => setTierUpgradeAddress(e.target.value)}
                        placeholder="Enter Upgrade Treasury Address"
                        className="sm:col-span-3 p-2.5 bg-dark-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                        required
                      />
                      <input
                        type="text"
                        value={tierUpgradeNetwork}
                        onChange={(e) => setTierUpgradeNetwork(e.target.value.toUpperCase())}
                        placeholder="TRC20"
                        className="p-2.5 bg-dark-950 border border-slate-700 rounded-xl text-xs text-white font-mono uppercase focus:border-emerald-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Default Receive Limit */}
                  <div className="space-y-2 p-4 bg-dark-900/60 rounded-xl border border-white/5">
                    <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                      Default User Receive Limit Threshold ($ USD)
                    </label>
                    <input
                      type="number"
                      step="100"
                      value={defaultReceiveLimit}
                      onChange={(e) => setDefaultReceiveLimit(e.target.value)}
                      placeholder="9000.00"
                      className="w-full p-2.5 bg-dark-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                      required
                    />
                    <p className="text-[11px] text-slate-400">
                      Standard threshold triggering the institutional $9,000 freeze alert & tier upgrade requirement.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-3 bg-gradient-to-r from-gold-400 to-amber-600 hover:from-gold-500 hover:to-amber-700 text-dark-950 font-bold rounded-xl text-xs transition shadow-gold disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving Settings...' : 'Save System Settings'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 5: TELEMETRY */}
            {activeTab === 'security' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <Radio className="w-5 h-5 text-emerald-400" />
                    Security Login Telemetry & Audit Logs
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto border border-white/10 rounded-xl bg-dark-950/80 font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-dark-900 border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">User Email</th>
                        <th className="px-4 py-3">Event Type</th>
                        <th className="px-4 py-3">IP Address</th>
                        <th className="px-4 py-3">Geo Location</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {securityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition">
                          <td className="px-4 py-3 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                          <td className="px-4 py-3 font-sans font-bold text-white">{log.user_email || 'System'}</td>
                          <td className="px-4 py-3 text-amber-400">{log.event_type}</td>
                          <td className="px-4 py-3 text-slate-300">{log.ip_address || '127.0.0.1'}</td>
                          <td className="px-4 py-3 text-slate-400">{log.geo_location?.country || 'Global'}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: TREASURY DEPOSIT ADDRESSES */}
            {activeTab === 'treasury' && (
              <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
                      <WalletCards className="w-5 h-5 text-cyan-400" />
                      <span>Deposit Receiving Wallets (BTC, ERC20, BNB)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure the 3 official deposit receiving addresses that users see when depositing funds.
                    </p>
                  </div>
                </div>

                {/* 3 Dedicated Core Wallet Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  {([
                    { 
                      key: 'BTC' as const, 
                      name: 'Bitcoin', 
                      net: 'BTC (Native)', 
                      icon: '₿', 
                      color: 'text-amber-400',
                      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                      border: 'border-amber-500/30 hover:border-amber-400/60',
                      bg: 'bg-dark-900/90'
                    },
                    { 
                      key: 'ERC20' as const, 
                      name: 'Ethereum / USDT', 
                      net: 'ERC-20 Protocol', 
                      icon: 'Ξ', 
                      color: 'text-indigo-400',
                      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
                      border: 'border-indigo-500/30 hover:border-indigo-400/60',
                      bg: 'bg-dark-900/90'
                    },
                    { 
                      key: 'BNB' as const, 
                      name: 'BNB Smart Chain', 
                      net: 'BEP-20 Protocol', 
                      icon: '⬡', 
                      color: 'text-yellow-400',
                      badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
                      border: 'border-yellow-500/30 hover:border-yellow-400/60',
                      bg: 'bg-dark-900/90'
                    },
                  ] as Array<{ key: 'BTC' | 'ERC20' | 'BNB'; name: string; net: string; icon: string; color: string; badge: string; border: string; bg: string }>).map((coin) => {
                    const activeAddr = depositAddresses.find(a => {
                      const aUpper = (a.asset || '').toUpperCase();
                      const nUpper = (a.network || '').toUpperCase();
                      if (coin.key === 'BTC') return aUpper === 'BTC' || aUpper === 'BITCOIN' || nUpper === 'BTC' || nUpper === 'NATIVE';
                      if (coin.key === 'ERC20') return aUpper === 'ERC20' || nUpper === 'ERC20' || aUpper === 'ETH' || aUpper === 'USDT';
                      if (coin.key === 'BNB') return aUpper === 'BNB' || aUpper === 'BSC' || nUpper === 'BEP20' || nUpper === 'BNB';
                      return aUpper === coin.key;
                    });

                    return (
                      <div key={coin.key} className={`p-5 rounded-2xl ${coin.bg} border ${coin.border} transition-all shadow-xl flex flex-col justify-between space-y-4`}>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-dark-950 border border-white/10 flex items-center justify-center text-xl font-bold font-mono">
                                <span className={coin.color}>{coin.icon}</span>
                              </div>
                              <div>
                                <h4 className="font-bold text-white font-mono text-sm">{coin.name} ({coin.key})</h4>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${coin.badge}`}>
                                  {coin.net}
                                </span>
                              </div>
                            </div>

                            {activeAddr ? (
                              <button
                                onClick={() => handleToggleDepositAddress(activeAddr)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono transition flex items-center gap-1.5 ${
                                  activeAddr.is_active
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${activeAddr.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                                <span>{activeAddr.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                NOT SET
                              </span>
                            )}
                          </div>

                          <div className="p-3 bg-dark-950 rounded-xl border border-white/5 space-y-1.5">
                            <span className="text-[10px] font-mono uppercase text-slate-500 block">Configured Wallet Address:</span>
                            {activeAddr?.address ? (
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs text-emerald-300 break-all select-all font-bold">
                                  {activeAddr.address}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(activeAddr.address, activeAddr.id)}
                                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition shrink-0"
                                >
                                  {copiedId === activeAddr.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-mono text-slate-500 italic">No address set yet. Click below to add.</span>
                            )}

                            {activeAddr?.memo_tag && (
                              <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                                <span className="text-amber-400">Memo/Tag: {activeAddr.memo_tag}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => openDepositAddressModal(activeAddr, coin.key)}
                          className="w-full py-2.5 bg-gradient-to-r from-gold-400 to-amber-600 hover:from-gold-500 hover:to-amber-700 text-dark-950 font-bold rounded-xl text-xs font-mono flex items-center justify-center gap-1.5 transition shadow-gold-sm"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>{activeAddr ? `Edit ${coin.key} Address` : `Set ${coin.key} Address`}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-dark-950/80 border border-cyan-500/30 rounded-2xl text-xs font-mono text-slate-300 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Instant Synchronization: </strong>
                    Updating any address above immediately reflects in the user's deposit modal when they choose that option.
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* MODALS */}

        {/* 1. FINANCIAL BALANCES & LIMITS EDITOR MODAL */}
        {actionModal.type === 'edit-financials' && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-xl max-h-[90vh] flex flex-col bg-dark-950 border border-gold-500/40 rounded-2xl shadow-2xl overflow-hidden my-auto">
              
              {/* Sticky Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0 bg-dark-950">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-gold-400" />
                  <h3 className="font-bold text-white text-base font-mono">Edit Financial Balances &amp; Limits</h3>
                </div>
                <button 
                  onClick={() => setActionModal({ type: null })} 
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Content */}
              <form onSubmit={handleSaveFinancials} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-4 sm:p-5 space-y-4 text-xs font-sans overflow-y-auto flex-1 custom-scrollbar">
                  
                  {/* Target User Info Card */}
                  <div className="p-3 bg-dark-900 rounded-xl border border-white/5 text-slate-300 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      User: <strong className="text-white">{actionModal.targetUser?.email || actionModal.userId}</strong>
                    </div>
                    {actionModal.targetUser?.phone_number && (
                      <div className="text-amber-300 font-mono text-[11px] flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-amber-400" />
                        <span>{actionModal.targetUser.phone_number}</span>
                      </div>
                    )}
                  </div>

                  {/* 1. Deposit Balance (Capital) */}
                  <div className="p-3.5 bg-dark-900 rounded-xl border border-cyan-500/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-cyan-400 uppercase tracking-wider text-[11px]">1. Deposit Balance ($ USD Capital)</label>
                      <span className="text-slate-400 text-[10px]">Active Capital Deposited</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={financialDepositBalance}
                      onChange={(e) => {
                        const newDep = e.target.value;
                        setFinancialDepositBalance(newDep);
                        const d = parseFloat(newDep) || 0;
                        const m = parseFloat(financialMiningBalance) || 0;
                        setFinancialMainBalance((d + m).toFixed(2));
                      }}
                      placeholder="0.00"
                      className="w-full p-2.5 bg-dark-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                      required
                    />
                    <input
                      type="text"
                      value={financialDepositRemark}
                      onChange={(e) => setFinancialDepositRemark(e.target.value)}
                      placeholder="Optional remark shown to user on deposit balance"
                      className="w-full p-2 bg-dark-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  {/* 2. Mining Balance / Amount Mined (Profit) */}
                  <div className="p-3.5 bg-dark-900 rounded-xl border border-emerald-500/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">2. Mining Balance ($ USD Amount Mined / Profit)</label>
                      <span className="text-slate-400 text-[10px]">Rig Mined Yield</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={financialMiningBalance}
                      onChange={(e) => {
                        const newMin = e.target.value;
                        setFinancialMiningBalance(newMin);
                        setFinancialProfitBalance(newMin);
                        const d = parseFloat(financialDepositBalance) || 0;
                        const m = parseFloat(newMin) || 0;
                        setFinancialMainBalance((d + m).toFixed(2));
                      }}
                      placeholder="0.00"
                      className="w-full p-2.5 bg-dark-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={financialMiningRemark}
                      onChange={(e) => setFinancialMiningRemark(e.target.value)}
                      placeholder="Optional remark shown to user on mining balance"
                      className="w-full p-2 bg-dark-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* 3. Main Balance (Total: Capital + Profit) */}
                  <div className="p-3.5 bg-dark-900 rounded-xl border border-gold-500/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-gold-400 uppercase tracking-wider text-[11px]">3. Main Balance ($ USD Total: Capital + Profit)</label>
                      <button
                        type="button"
                        onClick={() => {
                          const d = parseFloat(financialDepositBalance) || 0;
                          const m = parseFloat(financialMiningBalance) || 0;
                          setFinancialMainBalance((d + m).toFixed(2));
                        }}
                        className="px-2 py-0.5 rounded bg-gold-400/10 hover:bg-gold-400/20 text-gold-400 border border-gold-400/30 text-[10px] font-bold font-mono transition"
                        title="Calculate Main Balance = Deposit + Mining"
                      >
                        ⚡ Auto-Sum: Capital + Profit
                      </button>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={financialMainBalance}
                      onChange={(e) => setFinancialMainBalance(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2.5 bg-dark-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-gold-500 focus:outline-none"
                      required
                    />
                    <input
                      type="text"
                      value={financialBalanceRemark}
                      onChange={(e) => setFinancialBalanceRemark(e.target.value)}
                      placeholder="Optional remark shown to user on main balance"
                      className="w-full p-2 bg-dark-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:border-gold-500 focus:outline-none"
                    />
                  </div>

                  {/* 4. Profit Balance (Realized Trading/Dividends) */}
                  <div className="p-3.5 bg-dark-900 rounded-xl border border-indigo-500/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-indigo-400 uppercase tracking-wider text-[11px]">4. Profit Balance ($ USD Realized Returns)</label>
                      <span className="text-slate-400 text-[10px]">Dividends / Extra Returns</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={financialProfitBalance}
                      onChange={(e) => setFinancialProfitBalance(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2.5 bg-dark-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={financialProfitRemark}
                      onChange={(e) => setFinancialProfitRemark(e.target.value)}
                      placeholder="Optional remark shown to user on profit balance"
                      className="w-full p-2 bg-dark-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* 5. Convert Balance (Local Mine Asset) */}
                  <div className="p-3.5 bg-dark-900 rounded-xl border border-white/10 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-teal-400 uppercase tracking-wider text-[11px]">5. Convert Balance (Local Mine Asset)</label>
                      <span className="text-slate-400 text-[10px]">Converted Mine</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={financialConvertBalance}
                        onChange={(e) => setFinancialConvertBalance(e.target.value)}
                        placeholder="0.00"
                        className="col-span-2 p-2.5 bg-dark-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-teal-500 focus:outline-none"
                      />
                      <select
                        value={financialConvertCurrency}
                        onChange={(e) => setFinancialConvertCurrency(e.target.value)}
                        className="p-2.5 bg-dark-950 border border-slate-700 rounded-lg text-white text-xs font-mono font-bold focus:border-teal-500 focus:outline-none"
                      >
                        <option value="SGD">SGD Mine (S$)</option>
                        <option value="EUR">EUR Mine (€)</option>
                        <option value="GBP">GBP Mine (£)</option>
                        <option value="CAD">CAD Mine (CA$)</option>
                        <option value="AUD">AUD Mine (A$)</option>
                        <option value="JPY">JPY Mine (¥)</option>
                        <option value="CHF">CHF Mine (CHF)</option>
                        <option value="AED">AED Mine (AED)</option>
                        <option value="USD">USD Mine ($)</option>
                      </select>
                    </div>
                  </div>

                  {/* 6. Receive Limit & Account Tier */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Receive / Withdrawal Limit ($)</label>
                      <input
                        type="number"
                        step="100"
                        value={financialReceiveLimit}
                        onChange={(e) => setFinancialReceiveLimit(e.target.value)}
                        placeholder="9000"
                        className="w-full p-2.5 bg-dark-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-gold-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Account Tier</label>
                      <select
                        value={financialAccountTier}
                        onChange={(e) => setFinancialAccountTier(e.target.value)}
                        className="w-full p-2.5 bg-dark-950 border border-slate-700 rounded-lg text-white text-xs focus:border-gold-500 focus:outline-none"
                      >
                        <option value="BASIC">BASIC (Standard $9k Limit)</option>
                        <option value="BRONZE">BRONZE ($20k Limit)</option>
                        <option value="GOLD">GOLD ($50k Limit)</option>
                        <option value="PREMIUM">PREMIUM (Unlimited)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sticky Modal Footer */}
                <div className="p-4 border-t border-white/10 shrink-0 bg-dark-950 flex gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-gradient-to-r from-gold-400 to-amber-600 text-dark-950 font-bold rounded-xl text-xs hover:from-gold-500 hover:to-amber-700 transition shadow-gold disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Save Financial Balances & Limits'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionModal({ type: null })}
                    className="px-4 py-2.5 bg-dark-900 border border-white/10 text-slate-300 rounded-xl text-xs hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. REJECT GAS FEE MODAL */}
        {actionModal.type === 'review-gas-fee' && actionModal.withdrawal && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-dark-950 border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-white text-base font-mono">Reject Gas Fee &amp; Restore Balance</h3>
                <button onClick={() => setActionModal({ type: null })} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Rejecting this gas fee will automatically <strong>refund and restore {actionModal.withdrawal.amount} {actionModal.withdrawal.asset}</strong> back to the user's available balance.
              </p>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Rejection Reason *</label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Gas fee payment hash invalid / Underpaid 20% gas fee"
                  className="w-full h-24 p-3 bg-dark-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleReviewGasFee(actionModal.withdrawal!.id, 'REJECT', actionReason)}
                  disabled={actionLoading || !actionReason.trim()}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting & Refunding...' : 'Confirm Rejection & Restore Balance'}
                </button>
                <button
                  onClick={() => setActionModal({ type: null })}
                  className="px-4 py-2.5 bg-dark-900 border border-white/10 text-slate-300 rounded-xl text-xs hover:bg-white/10 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. REJECT DEPOSIT MODAL */}
        {actionModal.type === 'reject-deposit' && actionModal.deposit && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-dark-950 border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-white text-base font-mono">Reject Deposit Request</h3>
                <button onClick={() => setActionModal({ type: null })} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Rejection Reason *</label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Transaction hash not found on blockchain / Amount mismatch"
                  className="w-full h-24 p-3 bg-dark-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRejectDeposit(actionModal.deposit!.id, actionReason)}
                  disabled={actionLoading || !actionReason.trim()}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => setActionModal({ type: null })}
                  className="px-4 py-2.5 bg-dark-900 border border-white/10 text-slate-300 rounded-xl text-xs hover:bg-white/10 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedKyc && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-4xl bg-dark-950 border border-gold-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto custom-scrollbar">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white font-mono">KYC Identity Dossier &amp; Pictures</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                        selectedKyc.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                        selectedKyc.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {selectedKyc.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Applicant: {selectedKyc.first_name} {selectedKyc.last_name} &bull; {selectedKyc.user_profile?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedKyc(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Personal & Legal Credentials Grid */}
              <div className="p-5 rounded-2xl bg-dark-900/80 border border-white/10 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400 font-mono flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Applicant Legal Credentials</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">FULL LEGAL NAME</span>
                    <strong className="text-white text-sm">{selectedKyc.first_name} {selectedKyc.last_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">DOCUMENT TYPE</span>
                    <strong className="text-gold-400 text-sm">{selectedKyc.document_type}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">DOCUMENT ID NUMBER</span>
                    <strong className="text-white text-sm bg-dark-950 px-2 py-0.5 rounded border border-white/5">{selectedKyc.document_number}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">DATE OF BIRTH</span>
                    <strong className="text-white">{selectedKyc.dob}</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">COUNTRY / CITIZENSHIP</span>
                    <strong className="text-white">{selectedKyc.country}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block text-[10px]">RESIDENTIAL STREET ADDRESS</span>
                    <strong className="text-white">{selectedKyc.address}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CITY &amp; POSTAL CODE</span>
                    <strong className="text-white">{selectedKyc.city || 'N/A'}, {selectedKyc.postal_code || ''}</strong>
                  </div>
                </div>

                {selectedKyc.rejection_reason && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
                    <strong className="block text-[10px] uppercase tracking-wider text-rose-400">Previous Rejection Reason:</strong>
                    "{selectedKyc.rejection_reason}"
                  </div>
                )}
              </div>

              {/* Uploaded Photos Section (Front, Back, Selfie) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400 font-mono flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    <span>Uploaded Document Photos &amp; Proof-of-Life Selfie</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">Click any image to zoom / inspect in full resolution</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Photo 1: ID Front */}
                  <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">1. ID Document Front</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">VERIFICATION</span>
                    </div>
                    {selectedKyc.id_front_url ? (
                      <div 
                        onClick={() => setLightboxImage({ url: selectedKyc.id_front_url, title: `Front ID - ${selectedKyc.first_name} ${selectedKyc.last_name}` })}
                        className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black border border-slate-700 hover:border-gold-400 cursor-pointer group transition"
                      >
                        <img src={selectedKyc.id_front_url} alt="ID Front" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition gap-1.5 text-white text-xs font-bold">
                          <ZoomIn className="w-4 h-4 text-gold-400" />
                          <span>Click to Zoom</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl aspect-[4/3] bg-dark-950 flex items-center justify-center text-xs text-slate-500">
                        No Front Photo
                      </div>
                    )}
                  </div>

                  {/* Photo 2: ID Back */}
                  <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">2. ID Document Back</span>
                      <span className="text-[10px] text-slate-400 font-mono">OPTIONAL</span>
                    </div>
                    {selectedKyc.id_back_url ? (
                      <div 
                        onClick={() => setLightboxImage({ url: selectedKyc.id_back_url!, title: `Back ID - ${selectedKyc.first_name} ${selectedKyc.last_name}` })}
                        className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black border border-slate-700 hover:border-gold-400 cursor-pointer group transition"
                      >
                        <img src={selectedKyc.id_back_url} alt="ID Back" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition gap-1.5 text-white text-xs font-bold">
                          <ZoomIn className="w-4 h-4 text-gold-400" />
                          <span>Click to Zoom</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl aspect-[4/3] bg-dark-950 flex flex-col items-center justify-center text-xs text-slate-500 p-4 text-center">
                        <span>Not Provided</span>
                        <span className="text-[10px] text-slate-600">(Single-page Passport)</span>
                      </div>
                    )}
                  </div>

                  {/* Photo 3: Selfie with ID */}
                  <div className="p-3.5 rounded-2xl bg-dark-900 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">3. Selfie with ID</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">LIVENESS PROOF</span>
                    </div>
                    {selectedKyc.selfie_url ? (
                      <div 
                        onClick={() => setLightboxImage({ url: selectedKyc.selfie_url, title: `Selfie Photo - ${selectedKyc.first_name} ${selectedKyc.last_name}` })}
                        className="relative rounded-xl overflow-hidden aspect-[4/3] bg-black border border-emerald-500/40 hover:border-emerald-400 cursor-pointer group transition"
                      >
                        <img src={selectedKyc.selfie_url} alt="Selfie with ID" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition gap-1.5 text-white text-xs font-bold">
                          <ZoomIn className="w-4 h-4 text-emerald-400" />
                          <span>Click to Zoom</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl aspect-[4/3] bg-dark-950 flex items-center justify-center text-xs text-slate-500">
                        No Selfie Uploaded
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Action Buttons for Compliance Review */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-400 font-mono">
                  Submission ID: <span className="text-slate-200">{selectedKyc.id}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedKyc(null)}
                    className="px-4 py-2.5 bg-dark-900 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs transition"
                  >
                    Close
                  </button>

                  <button
                    onClick={() => {
                      const reason = prompt('Please enter rejection reason for this KYC submission:');
                      if (reason) handleRejectKyc(selectedKyc.id, reason);
                    }}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Verification</span>
                  </button>

                  <button
                    onClick={() => handleApproveKyc(selectedKyc.id)}
                    disabled={actionLoading || selectedKyc.status === 'VERIFIED'}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{actionLoading ? 'Verifying...' : 'Approve & Verify Identity'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 5. FULL-SCREEN IMAGE LIGHTBOX MODAL */}
        {lightboxImage && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg animate-fadeIn">
            <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
              
              <div className="w-full flex items-center justify-between pb-3 text-white text-xs font-mono">
                <span className="font-bold text-gold-400">{lightboxImage.title}</span>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black max-h-[82vh] flex items-center justify-center">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  className="max-h-[80vh] w-auto object-contain rounded-xl"
                />
              </div>

              <div className="pt-2 text-center text-[11px] text-slate-400">
                Press ESC or click close to dismiss
              </div>
            </div>
          </div>
        )}

        {/* 6. DEPOSIT ADDRESS EDITOR MODAL (EXCLUSIVELY BTC, ERC20, BNB) */}
        {depositModal.isOpen && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-dark-950 border border-gold-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400">
                    <WalletCards className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base font-mono">
                      {depositModal.isEdit ? `Edit ${depositModal.asset} Deposit Wallet` : `Add ${depositModal.asset} Deposit Wallet`}
                    </h3>
                    <p className="text-xs text-slate-400">Receiving destination address for user deposits.</p>
                  </div>
                </div>
                <button
                  onClick={() => setDepositModal((prev) => ({ ...prev, isOpen: false }))}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDepositAddress} className="space-y-4 text-xs font-mono">
                
                {/* 3 Dedicated Options Selector */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Select Deposit Cryptocurrency:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'BTC', name: 'Bitcoin', net: 'BTC', icon: '₿', color: 'text-amber-400', activeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50' },
                      { key: 'ERC20', name: 'USDT / ETH', net: 'ERC20', icon: 'Ξ', color: 'text-indigo-400', activeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' },
                      { key: 'BNB', name: 'BNB Chain', net: 'BEP20', icon: '⬡', color: 'text-yellow-400', activeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' },
                    ].map((opt) => {
                      const isChosen = depositModal.asset === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            // Find existing address for this coin if any
                            const existing = depositAddresses.find(a => {
                              const aUpper = (a.asset || '').toUpperCase();
                              const nUpper = (a.network || '').toUpperCase();
                              if (opt.key === 'BTC') return aUpper === 'BTC' || aUpper === 'BITCOIN' || nUpper === 'BTC' || nUpper === 'NATIVE';
                              if (opt.key === 'ERC20') return aUpper === 'ERC20' || nUpper === 'ERC20' || aUpper === 'ETH' || aUpper === 'USDT';
                              if (opt.key === 'BNB') return aUpper === 'BNB' || aUpper === 'BSC' || nUpper === 'BEP20' || nUpper === 'BNB';
                              return aUpper === opt.key;
                            });

                            if (existing) {
                              setDepositModal({
                                ...depositModal,
                                isEdit: true,
                                id: existing.id,
                                asset: opt.key,
                                network: opt.net,
                                address: existing.address,
                                memoTag: existing.memo_tag || '',
                                isActive: existing.is_active,
                              });
                            } else {
                              setDepositModal({
                                ...depositModal,
                                isEdit: false,
                                id: undefined,
                                asset: opt.key,
                                network: opt.net,
                                address: '',
                                memoTag: '',
                                isActive: true,
                              });
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-center font-bold text-xs transition flex flex-col items-center gap-0.5 ${
                            isChosen ? opt.activeBg + ' shadow-sm' : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className={`text-sm ${opt.color}`}>{opt.icon} {opt.key}</span>
                          <span className="text-[10px] font-normal text-slate-400">{opt.net} Network</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Destination Wallet Address for {depositModal.asset} ({depositModal.network})
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={depositModal.address}
                    onChange={(e) => setDepositModal({ ...depositModal, address: e.target.value })}
                    placeholder={`Paste public ${depositModal.asset} receiving address here...`}
                    className="w-full p-3 bg-dark-900 border border-slate-700 rounded-xl text-emerald-300 focus:border-emerald-500 focus:outline-none font-mono text-xs select-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Users will see this address immediately when depositing {depositModal.asset}.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Memo / Destination Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={depositModal.memoTag}
                    onChange={(e) => setDepositModal({ ...depositModal, memoTag: e.target.value })}
                    placeholder="Optional memo/tag or leave blank"
                    className="w-full p-3 bg-dark-900 border border-slate-700 rounded-xl text-white focus:border-gold-500 focus:outline-none text-xs"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-dark-900 rounded-xl border border-white/5">
                  <div>
                    <span className="font-bold text-white block">Active Receiving Status</span>
                    <span className="text-[11px] text-slate-400">When active, this address is shown to users for deposits.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDepositModal({ ...depositModal, isActive: !depositModal.isActive })}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                      depositModal.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {depositModal.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDepositModal((prev) => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !depositModal.address.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-gold-400 to-amber-600 hover:from-gold-500 hover:to-amber-700 text-dark-950 font-bold rounded-xl text-xs shadow-gold transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving Address...' : `Save & Update ${depositModal.asset} Address`}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* 7. USER PASSWORD & CREDENTIALS MODAL */}
        {passModal.isOpen && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md bg-dark-950 border border-gold-500/40 rounded-3xl p-6 shadow-2xl space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base font-mono">User Password Management</h3>
                    <p className="text-xs text-slate-400 truncate max-w-[220px]">{passModal.userEmail}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPassModal((prev) => ({ ...prev, isOpen: false }))}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-dark-900 border border-white/5 space-y-2 font-mono text-xs">
                <span className="text-slate-400 uppercase text-[10px] block">Current Recorded Password / Temp Key</span>
                {passModal.tempPassword ? (
                  <div className="flex items-center justify-between p-2.5 bg-dark-950 rounded-xl border border-gold-400/30 text-gold-300 font-bold">
                    <span>{passModal.tempPassword}</span>
                    <button
                      onClick={() => copyToClipboard(passModal.tempPassword!, 'pass')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedId === 'pass' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-dark-950 rounded-xl border border-slate-800 text-slate-400 text-[11px]">
                    Encrypted with Argon2id one-way cryptographic hash. You can override with a new password below.
                  </div>
                )}
              </div>

              <form onSubmit={handleDirectSetPassword} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-white uppercase tracking-wider mb-1">
                    Set New Password for User
                  </label>
                  <input
                    type="text"
                    required
                    minLength={8}
                    value={passModal.newPassword}
                    onChange={(e) => setPassModal({ ...passModal, newPassword: e.target.value })}
                    placeholder="Enter new password (min 8 chars)..."
                    className="w-full p-3 bg-dark-900 border border-slate-700 rounded-xl text-white focus:border-gold-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    The user will be able to log in immediately with this new password.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPassModal((prev) => ({ ...prev, isOpen: false }))}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !passModal.newPassword}
                    className="flex-1 py-3 bg-gradient-to-r from-gold-400 to-amber-600 hover:from-gold-500 hover:to-amber-700 text-dark-950 font-bold rounded-xl text-xs shadow-gold transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating...' : 'Set & Save Password'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* 8. WITHDRAWAL ACTION & REMARK MODAL */}
        {withdrawalModal.isOpen && withdrawalModal.withdrawal && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-dark-950 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100 font-mono text-xs">
              
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                    withdrawalModal.action === 'APPROVE'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    {withdrawalModal.action === 'APPROVE' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {withdrawalModal.action === 'APPROVE' ? 'Approve Direct Bank Wire' : 'Reject Withdrawal & Restore Balance'}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                      {withdrawalModal.withdrawal.user_profile?.email || withdrawalModal.withdrawal.user_id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setWithdrawalModal({ ...withdrawalModal, isOpen: false })}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Withdrawal Details Card */}
              <div className="p-4 bg-dark-900 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-slate-400">Withdrawal Amount:</span>
                  <span className="font-bold text-emerald-400 text-base font-mono">
                    {withdrawalModal.withdrawal.amount} {withdrawalModal.withdrawal.asset}
                  </span>
                </div>

                {/* Full Bank Wire Destination Box */}
                {withdrawalModal.withdrawal.bank_details && withdrawalModal.withdrawal.bank_details.account_number ? (
                  <div className="p-3 bg-dark-950 rounded-xl border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Payout Bank Destination</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const bd = withdrawalModal.withdrawal!.bank_details!;
                          const text = `=== WIRE TRANSFER PAYOUT ===\nBeneficiary: ${bd.account_holder || ''}\nBank Name: ${bd.bank_name || ''}\nAccount/IBAN: ${bd.account_number || ''}\nSWIFT/BIC: ${bd.swift_routing || ''}\nCountry: ${bd.bank_country || 'Singapore'}\nCurrency: ${bd.currency || 'SGD'}\nAmount: ${withdrawalModal.withdrawal!.amount} ${withdrawalModal.withdrawal!.asset}`;
                          copyToClipboard(text, 'wire-all-modal');
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-sans font-bold flex items-center gap-1 transition"
                      >
                        {copiedId === 'wire-all-modal' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy All Details</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Bank Name</span>
                        <span className="text-white font-bold">{withdrawalModal.withdrawal.bank_details.bank_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Account Holder</span>
                        <span className="text-slate-200 font-bold">{withdrawalModal.withdrawal.bank_details.account_holder}</span>
                      </div>
                    </div>

                    <div className="p-2 bg-dark-900 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-slate-500 text-[9px] block">ACCOUNT NUMBER / IBAN</span>
                        <span className="text-emerald-300 font-bold font-mono text-xs">{withdrawalModal.withdrawal.bank_details.account_number}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(withdrawalModal.withdrawal!.bank_details!.account_number!, 'acct-num-modal')}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                        title="Copy Account Number"
                      >
                        {copiedId === 'acct-num-modal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 text-[10px] block">SWIFT / BIC / ROUTING</span>
                        <span className="text-gold-400 font-bold font-mono">{withdrawalModal.withdrawal.bank_details.swift_routing || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Country / Currency</span>
                        <span className="text-slate-300">{withdrawalModal.withdrawal.bank_details.bank_country || 'Singapore'} ({withdrawalModal.withdrawal.bank_details.currency || 'SGD'})</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Destination:</span>
                    <span className="text-slate-200 font-mono text-xs font-bold truncate max-w-[200px]">
                      {withdrawalModal.withdrawal.destination_wallet_address || 'Manual Transfer'}
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Clearance Code (HBC/VBC):</span>
                  <span className="text-amber-400 font-bold font-mono">
                    {withdrawalModal.withdrawal.hbc_vbc_code || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Notice regarding balance restoration on rejection */}
              {withdrawalModal.action === 'REJECT' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                  <strong>⚠️ Automatic Fund Restoration: </strong>
                  Rejecting this withdrawal will automatically restore the full balance of {withdrawalModal.withdrawal.amount} {withdrawalModal.withdrawal.asset} back to the user's active account.
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (withdrawalModal.action === 'APPROVE') {
                    handleApproveWithdrawal(withdrawalModal.withdrawal!.id, withdrawalModal.remark);
                  } else {
                    handleRejectWithdrawal(withdrawalModal.withdrawal!.id, withdrawalModal.remark);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-bold text-white uppercase tracking-wider mb-1">
                    Compliance Remark / Reason (Visible to User)
                  </label>
                  <textarea
                    rows={2}
                    required={withdrawalModal.action === 'REJECT'}
                    value={withdrawalModal.remark}
                    onChange={(e) => setWithdrawalModal({ ...withdrawalModal, remark: e.target.value })}
                    placeholder={
                      withdrawalModal.action === 'APPROVE'
                        ? 'e.g. Approved & Dispatched via DBS Bank Wire clearance'
                        : 'e.g. Wrong HBC or VBC clearance code. Please contact support.'
                    }
                    className="w-full p-3 bg-dark-900 border border-slate-700 rounded-xl text-white focus:border-gold-500 focus:outline-none text-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    This remark will be presented on the user's dashboard withdrawal history.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawalModal({ ...withdrawalModal, isOpen: false })}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className={`flex-1 py-3 font-bold rounded-xl text-xs shadow-lg transition disabled:opacity-50 ${
                      withdrawalModal.action === 'APPROVE'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20'
                        : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-rose-500/20'
                    }`}
                  >
                    {actionLoading ? 'Processing...' : withdrawalModal.action === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection (Refund)'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* 9. USER BANK DETAILS AUDIT MODAL */}
        {bankModal.isOpen && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-dark-950 border border-gold-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100 font-mono text-xs">
              
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Full Bank Wire Account Details</h3>
                    <p className="text-[11px] text-slate-400 truncate max-w-[280px]">
                      {bankModal.title || bankModal.user?.full_name || bankModal.user?.email || 'User Bank Record'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBankModal({ isOpen: false, user: null, bankDetails: null, title: '' })}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(() => {
                const details = bankModal.bankDetails || bankModal.user?.bank_details;
                if (!details || !details.account_number) {
                  return (
                    <div className="p-8 text-center rounded-2xl bg-dark-900 border border-slate-800 text-slate-400 space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="font-sans text-sm">This user has not yet submitted or saved bank account details.</p>
                    </div>
                  );
                }

                const fullWireText = `=== BANK WIRE TRANSFER DETAILS ===\nBeneficiary Name: ${details.account_holder || bankModal.user?.full_name || ''}\nBank Name: ${details.bank_name || ''}\nAccount Number / IBAN: ${details.account_number || ''}\nSWIFT / BIC / Routing: ${details.swift_routing || ''}\nBank Country: ${details.bank_country || 'Singapore'}\nSettlement Currency: ${details.currency || 'SGD'}`;

                return (
                  <div className="space-y-4">
                    {/* Action Bar */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verified Saved Banking Details</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(fullWireText, 'copy-all-wire')}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 text-dark-950 font-bold text-xs shadow-md hover:from-gold-400 hover:to-amber-500 flex items-center gap-1.5 transition"
                      >
                        {copiedId === 'copy-all-wire' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-dark-950" />
                            <span>Copied All!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-dark-950" />
                            <span>Copy Full Wire Info</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-4 bg-dark-900 rounded-2xl border border-emerald-500/30 space-y-3.5">
                      {/* Bank Name */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase block">Bank Name</span>
                          <span className="text-base font-bold text-white font-sans">{details.bank_name}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(details.bank_name || '', 'bank_name')}
                          className="p-1.5 rounded-lg bg-dark-950 border border-slate-800 text-slate-400 hover:text-white transition"
                          title="Copy Bank Name"
                        >
                          {copiedId === 'bank_name' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Beneficiary Name */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase block">Beneficiary / Account Holder</span>
                          <span className="text-sm font-bold text-slate-100">{details.account_holder || bankModal.user?.full_name}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(details.account_holder || bankModal.user?.full_name || '', 'holder')}
                          className="p-1.5 rounded-lg bg-dark-950 border border-slate-800 text-slate-400 hover:text-white transition"
                          title="Copy Account Holder"
                        >
                          {copiedId === 'holder' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Account Number / IBAN */}
                      <div className="space-y-1">
                        <span className="text-slate-500 text-[10px] uppercase block">Account Number / IBAN</span>
                        <div className="flex items-center justify-between p-3 bg-dark-950 rounded-xl border border-emerald-500/40 text-emerald-300 font-bold font-mono text-sm shadow-inner">
                          <span className="select-all tracking-wider">{details.account_number}</span>
                          <button
                            onClick={() => copyToClipboard(details.account_number || '', 'acct')}
                            className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-sans text-xs flex items-center gap-1 transition"
                          >
                            {copiedId === 'acct' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === 'acct' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* SWIFT / BIC / Routing Code */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase block">SWIFT / BIC / Routing Code</span>
                          <span className="text-gold-400 font-bold font-mono text-sm">{details.swift_routing || 'N/A'}</span>
                        </div>
                        {details.swift_routing && (
                          <button
                            onClick={() => copyToClipboard(details.swift_routing || '', 'swift')}
                            className="p-1.5 rounded-lg bg-dark-950 border border-slate-800 text-slate-400 hover:text-white transition"
                            title="Copy SWIFT"
                          >
                            {copiedId === 'swift' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      {/* Country & Settlement Currency */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                        <div className="p-2.5 rounded-xl bg-dark-950 border border-white/5">
                          <span className="text-slate-500 text-[10px] uppercase block">Bank Country</span>
                          <span className="text-slate-200 font-bold">{details.bank_country || 'Singapore'}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-dark-950 border border-white/5">
                          <span className="text-slate-500 text-[10px] uppercase block">Settlement Currency</span>
                          <span className="text-emerald-400 font-bold font-mono text-sm">{details.currency || 'SGD'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <button
                type="button"
                onClick={() => setBankModal({ isOpen: false, user: null, bankDetails: null, title: '' })}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
              >
                Close
              </button>

            </div>
          </div>
        )}

        {/* Phase 1-4 Developer & Admin Test Console (Embedded for Admin) */}
        <DevAuthAdminTest
          isOpen={testConsoleOpen}
          onClose={() => setTestConsoleOpen(false)}
          hideFloatingButton={true}
        />



      </div>
    </div>
  );



};
