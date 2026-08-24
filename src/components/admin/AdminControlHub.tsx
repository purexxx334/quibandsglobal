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
  Coins
} from 'lucide-react';

import { AdminSupportChatTab } from './AdminSupportChatTab';

import { useAuth } from '../../context/AuthContext';
import { 
  UserProfile, 
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
import { API_BASE } from '../../config/api';
import { DevAuthAdminTest } from '../dev/DevAuthAdminTest';



interface AdminControlHubProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'users' | 'deposits' | 'conversions' | 'withdrawals' | 'kyc' | 'support' | 'fees' | 'settings' | 'security' | 'treasury' | 'notifications';

export const AdminControlHub: React.FC<AdminControlHubProps> = ({ isOpen, onClose }) => {

  const { session, profile } = useAuth();
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
  const [financialMainBalance, setFinancialMainBalance] = useState('');
  const [financialMiningBalance, setFinancialMiningBalance] = useState('');
  const [financialProfitBalance, setFinancialProfitBalance] = useState('');
  const [financialConvertBalance, setFinancialConvertBalance] = useState('');
  const [financialConvertCurrency, setFinancialConvertCurrency] = useState('SGD');
  const [financialReceiveLimit, setFinancialReceiveLimit] = useState('9000.00');
  const [financialAccountTier, setFinancialAccountTier] = useState('BASIC');
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
    asset: 'USDT',
    network: 'TRC20',
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

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();

      // Fetch System Settings
      const setRes = await fetch(`${API_BASE}/admin/settings`, { headers });
      const setJson = await setRes.json();
      if (setJson.success && setJson.data) {
        if (setJson.data.gas_fee_address) {
          setGasFeeAddress(setJson.data.gas_fee_address.value);
          if (setJson.data.gas_fee_address.network) setGasFeeNetwork(setJson.data.gas_fee_address.network);
        }
        if (setJson.data.tier_upgrade_address) {
          setTierUpgradeAddress(setJson.data.tier_upgrade_address.value);
          if (setJson.data.tier_upgrade_address.network) setTierUpgradeNetwork(setJson.data.tier_upgrade_address.network);
        }
        if (setJson.data.default_receive_limit) {
          setDefaultReceiveLimit(setJson.data.default_receive_limit.value);
        }
      }

      if (activeTab === 'users') {
        const res = await fetch(`${API_BASE}/admin/users`, { headers });
        const json = await res.json();
        setUsers(Array.isArray(json.data) ? json.data : []);
      } else if (activeTab === 'deposits') {
        const res = await fetch(`${API_BASE}/admin/deposits`, { headers });
        const json = await res.json();
        setAdminDeposits(Array.isArray(json.data) ? json.data : []);
      } else if (activeTab === 'conversions') {
        const res = await fetch(`${API_BASE}/conversions`, { headers });
        const json = await res.json();
        setConversions(Array.isArray(json.data) ? json.data : []);
      } else if (activeTab === 'withdrawals') {
        const res = await fetch(`${API_BASE}/admin/withdrawals`, { headers });
        const json = await res.json();
        setAdminWithdrawals(Array.isArray(json.data) ? json.data : []);
      } else if (activeTab === 'kyc') {
        const res = await fetch(`${API_BASE}/admin/kyc`, { headers });
        const json = await res.json();
        setKycSubmissions(Array.isArray(json.data) ? json.data : []);
      } else if (activeTab === 'fees') {
        const res = await fetch(`${API_BASE}/admin/withdrawal-fees`, { headers });
        const json = await res.json();
        setWithdrawalFees(Array.isArray(json.data) ? json.data : []);
      } else if (activeTab === 'security') {
        const res = await fetch(`${API_BASE}/admin/security/logs`, { headers });
        const json = await res.json();
        setSecurityLogs(Array.isArray(json.data) ? json.data : []);
      } else if (activeTab === 'treasury') {
        const res = await fetch(`${API_BASE}/admin/deposit-addresses`, { headers });
        const json = await res.json();
        setDepositAddresses(Array.isArray(json.data) ? json.data : []);
      } else if (activeTab === 'notifications') {
        const res = await fetch(`${API_BASE}/admin/security/notifications`, { headers });
        const json = await res.json();
        setNotifications(Array.isArray(json.data) ? json.data : []);
      }

      // Always fetch KYC & Conversions in background to populate pending counter
      if (activeTab !== 'kyc') {
        fetch(`${API_BASE}/admin/kyc`, { headers })
          .then(r => r.json())
          .then(j => { if (j.success && Array.isArray(j.data)) setKycSubmissions(j.data); })
          .catch(() => {});
      }
      if (activeTab !== 'conversions') {
        fetch(`${API_BASE}/conversions`, { headers })
          .then(r => r.json())
          .then(j => { if (j.success && Array.isArray(j.data)) setConversions(j.data); })
          .catch(() => {});
      }
    } catch (err: any) {
      console.warn('Admin fetch error:', err.message);
      showBanner('error', err.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);

    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, activeTab, session?.access_token]);

  // Load User Dossier
  const loadUserDossier = async (userId: string) => {
    if (!userId) return;
    setSelectedUserId(userId);
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/admin/users/${userId}/dossier`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        setUserDossier(json.data);
      } else {
        showBanner('error', json.error || 'Failed to load user dossier.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Financial Balances Editor Modal
  const openFinancialEditor = (u: UserProfile) => {
    setActionModal({ type: 'edit-financials', userId: u.auth_user_id, targetUser: u });
    setFinancialMainBalance(u.main_balance !== undefined ? String(u.main_balance) : '0');
    setFinancialMiningBalance(u.mining_balance !== undefined ? String(u.mining_balance) : '0');
    setFinancialProfitBalance(u.profit_balance !== undefined ? String(u.profit_balance) : '0');
    setFinancialConvertBalance(u.convert_balance !== undefined ? String(u.convert_balance) : '0');
    setFinancialConvertCurrency(u.convert_currency || 'SGD');
    setFinancialReceiveLimit(u.receive_limit !== undefined ? String(u.receive_limit) : '9000.00');
    setFinancialAccountTier(u.account_tier || 'BASIC');
    setFinancialBalanceRemark(u.balance_remark || '');
    setFinancialMiningRemark(u.mining_remark || '');
    setFinancialProfitRemark(u.profit_remark || '');
  };

  // Save User Financial Balances & Limits
  const handleSaveFinancials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal.userId) return;

    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/admin/users/${actionModal.userId}/financial-balances`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mainBalance: parseFloat(financialMainBalance) || 0,
          miningBalance: parseFloat(financialMiningBalance) || 0,
          profitBalance: parseFloat(financialProfitBalance) || 0,
          convertBalance: parseFloat(financialConvertBalance) || 0,
          convertCurrency: financialConvertCurrency,
          receiveLimit: parseFloat(financialReceiveLimit) || 9000,
          accountTier: financialAccountTier,
          balanceRemark: financialBalanceRemark.trim() || null,
          miningRemark: financialMiningRemark.trim() || null,
          profitRemark: financialProfitRemark.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showBanner('success', 'User balances, limits, and remarks updated successfully.');
        setActionModal({ type: null });
        fetchData();
        if (selectedUserId === actionModal.userId) {
          loadUserDossier(selectedUserId);
        }
      } else {
        showBanner('error', json.error || 'Failed to update financial balances.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Deposit Address Editor Modal
  const openDepositAddressModal = (addr?: DepositAddress) => {
    if (addr) {
      setDepositModal({
        isOpen: true,
        isEdit: true,
        id: addr.id,
        asset: addr.asset,
        network: addr.network,
        address: addr.address,
        memoTag: addr.memo_tag || '',
        notes: addr.notes || '',
        isActive: addr.is_active,
      });
    } else {
      setDepositModal({
        isOpen: true,
        isEdit: false,
        asset: 'USDT',
        network: 'TRC20',
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
        showBanner('success', `Deposit address for ${depositModal.asset} ${depositModal.isEdit ? 'updated' : 'configured'} successfully.`);
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

  // Review Gas Fee Payment (Approve or Reject with Auto-Refund)
  const handleReviewGasFee = async (withdrawalId: string, action: 'APPROVE' | 'REJECT', reason?: string) => {
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/admin/withdrawals/${withdrawalId}/review-gas-fee`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, reason }),
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', json.message || `Gas fee ${action === 'APPROVE' ? 'approved' : 'rejected'}.`);
        setActionModal({ type: null });
        setActionReason('');
        fetchData();
      } else {
        showBanner('error', json.error || 'Failed to review gas fee.');
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
      const json = await res.json();
      if (json.success) {
        showBanner('success', successMsg);
        setActionModal({ type: null });
        setActionReason('');
        setCustomPassword('');
        setAdjustAmount('');
        loadUserDossier(selectedUserId);
        fetchData();
      } else {
        showBanner('error', json.error || 'Action failed.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Deposit
  const handleApproveDeposit = async (depositId: string) => {
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/admin/deposits/${depositId}/approve`, {
        method: 'POST',
        headers,
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', 'Deposit approved and wallet credited.');
        setActionModal({ type: null });
        fetchData();
      } else {
        showBanner('error', json.error || 'Approval failed.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Deposit
  const handleRejectDeposit = async (depositId: string, reason: string) => {
    if (!reason.trim()) {
      showBanner('error', 'Rejection reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/admin/deposits/${depositId}/reject`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', 'Deposit request rejected.');
        setActionModal({ type: null });
        setActionReason('');
        fetchData();
      } else {
        showBanner('error', json.error || 'Rejection failed.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Approve Conversion Request
  const handleApproveConversion = async (conversionId: string) => {
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/conversions/${conversionId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'CONVERTED' }),
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', 'Conversion approved! Converted balance credited to user.');
        fetchData();
      } else {
        showBanner('error', json.error || 'Approval failed.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Conversion Request
  const handleRejectConversion = async (conversionId: string, reason?: string) => {
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/conversions/${conversionId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'REJECTED', adminNotes: reason || 'Rejected by Admin' }),
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', 'Conversion request rejected.');
        fetchData();
      } else {
        showBanner('error', json.error || 'Rejection failed.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Approve KYC
  const handleApproveKyc = async (submissionId: string) => {
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/admin/kyc/${submissionId}/review`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status: 'VERIFIED' }),
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', 'User KYC identity verified and approved!');
        setSelectedKyc(null);
        fetchData();
      } else {
        showBanner('error', json.error || 'Failed to approve KYC.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject KYC
  const handleRejectKyc = async (submissionId: string, reason: string) => {
    if (!reason.trim()) {
      showBanner('error', 'Rejection reason is required.');
      return;
    }
    setActionLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/admin/kyc/${submissionId}/review`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status: 'REJECTED', rejectionReason: reason.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        showBanner('success', 'KYC submission rejected and user notified.');
        setSelectedKyc(null);
        setActionModal({ type: null });
        setActionReason('');
        fetchData();
      } else {
        showBanner('error', json.error || 'Failed to reject KYC.');
      }
    } catch (err: any) {
      showBanner('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };


  if (!isOpen) return null;

  // Search filter
  const filteredUsers = (users || []).filter((u) => {
    if (!u) return false;
    const email = u.email || '';
    const name = u.full_name || '';
    const q = searchQuery.toLowerCase();
    const matchesSearch = email.toLowerCase().includes(q) || name.toLowerCase().includes(q);
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
                          <th className="px-4 py-3">Main Balance</th>
                          <th className="px-4 py-3">Mining Balance</th>
                          <th className="px-4 py-3">Profit Balance</th>
                          <th className="px-4 py-3">Convert Balance</th>
                          <th className="px-4 py-3">Total Portfolio</th>
                          <th className="px-4 py-3">Referrals</th>
                          <th className="px-4 py-3">Account Tier</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center py-10 text-slate-500 font-sans">
                              No user accounts found matching current filters.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-white/[0.02] transition">
                              <td className="px-4 py-3 font-sans">
                                <div className="font-bold text-white text-xs">{u.full_name || 'Trader'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
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
                              <td className="px-4 py-3 font-bold text-emerald-400">
                                ${(u.main_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 font-bold text-cyan-400">
                                ${(u.mining_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 font-bold text-indigo-300">
                                ${(u.profit_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 font-bold text-teal-300">
                                {(u.convert_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {u.convert_currency || 'SGD'}
                              </td>
                              <td className="px-4 py-3 font-bold text-gold-400">
                                ${(u.total_balance || ((u.main_balance || 0) + (u.mining_balance || 0) + (u.profit_balance || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                          <div className="text-slate-400 text-[10px] uppercase">Full Name & Email</div>
                          <div className="text-white font-bold font-sans text-sm">{userDossier.profile?.full_name || 'N/A'}</div>
                          <div className="text-slate-300 text-xs">{userDossier.profile?.email}</div>
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

            {/* TAB 3: WITHDRAWALS & GAS FEE APPROVALS */}
            {activeTab === 'withdrawals' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                      <ArrowUpCircle className="w-5 h-5 text-rose-400" />
                      Institutional Withdrawals & 20% Gas Fee Clearance
                    </h3>
                    <p className="text-xs text-slate-400">Approve or reject gas fee payments (rejection automatically restores user balance)</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto border border-white/10 rounded-xl bg-dark-950/80 font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-dark-900 border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Full Payout (Bank/Wallet)</th>
                        <th className="px-4 py-3">External Gas Fee</th>
                        <th className="px-4 py-3">Payout Destination</th>
                        <th className="px-4 py-3">HBC / VBC Code</th>
                        <th className="px-4 py-3">Gas Fee Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {adminWithdrawals.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-10 text-slate-500">No withdrawal requests found.</td></tr>
                      ) : (
                        adminWithdrawals.map((w) => (
                          <tr key={w.id} className="hover:bg-white/[0.02] transition">
                            <td className="px-4 py-3 text-slate-400">{new Date(w.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 font-sans font-bold text-white">{w.user_profile?.email || w.user_id.slice(0, 10)}</td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-white">{w.amount} {w.asset}</span>
                              <span className="block text-[10px] text-emerald-400 font-bold">100% Full Payout</span>
                              {w.converted_amount && <span className="block text-[10px] text-slate-400 font-mono">({w.local_currency} {w.converted_amount})</span>}
                            </td>
                            <td className="px-4 py-3 font-bold text-amber-400">{w.fee_amount} {w.asset}</td>
                            <td className="px-4 py-3 text-slate-300 truncate max-w-xs" title={w.destination_wallet_address}>{w.destination_wallet_address}</td>
                            <td className="px-4 py-3 text-amber-300 font-mono font-bold">{w.hbc_vbc_code || 'N/A'}</td>

                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                w.gas_fee_status === 'APPROVED' || w.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                                w.gas_fee_status === 'REJECTED' || w.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>{w.gas_fee_status || w.status}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {w.status === 'PENDING' && (
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleReviewGasFee(w.id, 'APPROVE')}
                                    className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-semibold hover:bg-emerald-500/30"
                                  >
                                    Approve Gas
                                  </button>
                                  <button
                                    onClick={() => setActionModal({ type: 'review-gas-fee', withdrawal: w })}
                                    className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-lg text-xs font-semibold hover:bg-rose-500/30"
                                  >
                                    Reject (Refund)
                                  </button>
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
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                      <WalletCards className="w-5 h-5 text-cyan-400" />
                      <span>Treasury & Receiving Deposit Addresses</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure and edit destination wallet addresses assigned to users during deposit workflows.
                    </p>
                  </div>

                  <button
                    onClick={() => openDepositAddressModal()}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl text-xs font-mono flex items-center gap-1.5 transition shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Address</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto border border-white/10 rounded-xl bg-dark-950/80 font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-dark-900 border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Asset</th>
                        <th className="px-4 py-3">Network</th>
                        <th className="px-4 py-3">Destination Address</th>
                        <th className="px-4 py-3">Memo / Tag</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {depositAddresses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-500 font-sans">
                            No deposit addresses configured. Click "Add New Address" above.
                          </td>
                        </tr>
                      ) : (
                        depositAddresses.map((addr) => (
                          <tr key={addr.id} className="hover:bg-white/[0.02] transition">
                            <td className="px-4 py-3 font-bold text-gold-400 text-sm">{addr.asset}</td>
                            <td className="px-4 py-3 text-slate-300">
                              <span className="px-2 py-0.5 rounded bg-dark-850 border border-slate-700 text-[11px]">
                                {addr.network}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-200 select-all font-mono">
                              <div className="flex items-center gap-2">
                                <span className="truncate max-w-sm">{addr.address}</span>
                                <button
                                  onClick={() => copyToClipboard(addr.address, addr.id)}
                                  className="text-slate-500 hover:text-white transition"
                                >
                                  {copiedId === addr.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {addr.memo_tag ? (
                                <span className="bg-dark-850 px-2 py-0.5 rounded border border-slate-800 text-[10px] text-amber-300">
                                  {addr.memo_tag}
                                </span>
                              ) : (
                                <span className="text-slate-600 font-sans">None</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleDepositAddress(addr)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${
                                  addr.is_active 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30' 
                                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${addr.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                                <span>{addr.is_active ? 'Active' : 'Inactive'}</span>
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => openDepositAddressModal(addr)}
                                className="px-3 py-1.5 bg-dark-850 hover:bg-gold-500/20 text-slate-200 hover:text-gold-400 border border-white/10 hover:border-gold-500/40 rounded-xl text-xs font-semibold transition inline-flex items-center gap-1.5"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit Address</span>
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

          </div>
        </div>

        {/* MODALS */}

        {/* 1. FINANCIAL BALANCES & LIMITS EDITOR MODAL */}
        {actionModal.type === 'edit-financials' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-xl bg-dark-950 border border-gold-500/40 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-gold-400" />
                  <h3 className="font-bold text-white text-base font-mono">Edit Financial Balances & Limits</h3>
                </div>
                <button onClick={() => setActionModal({ type: null })} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFinancials} className="space-y-4 text-xs font-sans">
                <div className="p-3 bg-dark-900 rounded-xl border border-white/5 text-slate-300">
                  User: <strong>{actionModal.targetUser?.email || actionModal.userId}</strong>
                </div>

                {/* 1. Main Balance */}
                <div className="p-3.5 bg-dark-900 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-gold-400 uppercase tracking-wider text-[11px]">Main Balance ($ USD)</label>
                    <span className="text-slate-400 text-[10px]">Free edit without remark</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={financialMainBalance}
                    onChange={(e) => setFinancialMainBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2 bg-dark-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-gold-500 focus:outline-none"
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

                {/* 2. Mining Balance */}
                <div className="p-3.5 bg-dark-900 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">Mining Balance ($ USD)</label>
                    <span className="text-slate-400 text-[10px]">Rig Balance</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={financialMiningBalance}
                    onChange={(e) => setFinancialMiningBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2 bg-dark-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={financialMiningRemark}
                    onChange={(e) => setFinancialMiningRemark(e.target.value)}
                    placeholder="Optional remark shown to user on mining balance"
                    className="w-full p-2 bg-dark-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* 3. Profit Balance */}
                <div className="p-3.5 bg-dark-900 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-indigo-400 uppercase tracking-wider text-[11px]">Profit Balance ($ USD)</label>
                    <span className="text-slate-400 text-[10px]">Realized Trading/Dividends</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={financialProfitBalance}
                    onChange={(e) => setFinancialProfitBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2 bg-dark-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={financialProfitRemark}
                    onChange={(e) => setFinancialProfitRemark(e.target.value)}
                    placeholder="Optional remark shown to user on profit balance"
                    className="w-full p-2 bg-dark-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* 4. Convert Balance (Local Mine Asset) */}
                <div className="p-3.5 bg-dark-900 rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-teal-400 uppercase tracking-wider text-[11px]">Convert Balance (Local Mine Asset)</label>
                    <span className="text-slate-400 text-[10px]">Converted Mine</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={financialConvertBalance}
                      onChange={(e) => setFinancialConvertBalance(e.target.value)}
                      placeholder="0.00"
                      className="col-span-2 p-2 bg-dark-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-teal-500 focus:outline-none"
                    />
                    <select
                      value={financialConvertCurrency}
                      onChange={(e) => setFinancialConvertCurrency(e.target.value)}
                      className="p-2 bg-dark-950 border border-slate-700 rounded-lg text-white text-xs font-mono font-bold focus:border-teal-500 focus:outline-none"
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

                {/* 5. Receive Limit & Account Tier */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Receive / Withdrawal Limit ($)</label>
                    <input
                      type="number"
                      step="100"
                      value={financialReceiveLimit}
                      onChange={(e) => setFinancialReceiveLimit(e.target.value)}
                      placeholder="9000"
                      className="w-full p-2 bg-dark-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-gold-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Account Tier</label>
                    <select
                      value={financialAccountTier}
                      onChange={(e) => setFinancialAccountTier(e.target.value)}
                      className="w-full p-2 bg-dark-950 border border-slate-700 rounded-lg text-white text-xs focus:border-gold-500 focus:outline-none"
                    >
                      <option value="BASIC">BASIC (Standard $9k Limit)</option>
                      <option value="BRONZE">BRONZE ($20k Limit)</option>
                      <option value="GOLD">GOLD ($50k Limit)</option>
                      <option value="PREMIUM">PREMIUM (Unlimited)</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-dark-950 border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-white text-base font-mono">Reject Gas Fee & Restore Balance</h3>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-4xl bg-dark-950 border border-gold-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto custom-scrollbar">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <FileCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white font-mono">KYC Identity Dossier & Pictures</h3>
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
                    <span className="text-slate-500 block text-[10px]">CITY & POSTAL CODE</span>
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
                    <span>Uploaded Document Photos & Proof-of-Life Selfie</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg animate-fadeIn">
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

        {/* 6. DEPOSIT ADDRESS EDITOR MODAL */}
        {depositModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-dark-950 border border-cyan-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <WalletCards className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base font-mono">
                      {depositModal.isEdit ? 'Edit Deposit Address' : 'Add New Deposit Address'}
                    </h3>
                    <p className="text-xs text-slate-400">Configure receiving destination address for users.</p>
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
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gold-400 uppercase tracking-wider mb-1">
                      Asset Symbol
                    </label>
                    <input
                      type="text"
                      required
                      value={depositModal.asset}
                      onChange={(e) => setDepositModal({ ...depositModal, asset: e.target.value.toUpperCase() })}
                      placeholder="USDT, BTC, ETH, SOL, LTC..."
                      className="w-full p-3 bg-dark-900 border border-slate-700 rounded-xl text-white uppercase focus:border-gold-500 focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                      Blockchain Network
                    </label>
                    <input
                      type="text"
                      required
                      value={depositModal.network}
                      onChange={(e) => setDepositModal({ ...depositModal, network: e.target.value.toUpperCase() })}
                      placeholder="TRC20, ERC20, Native, BEP20..."
                      className="w-full p-3 bg-dark-900 border border-slate-700 rounded-xl text-white uppercase focus:border-cyan-500 focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Destination Wallet Address
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={depositModal.address}
                    onChange={(e) => setDepositModal({ ...depositModal, address: e.target.value })}
                    placeholder="Enter full public wallet address string..."
                    className="w-full p-3 bg-dark-900 border border-slate-700 rounded-xl text-emerald-300 focus:border-emerald-500 focus:outline-none font-mono text-xs select-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Memo / Destination Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={depositModal.memoTag}
                    onChange={(e) => setDepositModal({ ...depositModal, memoTag: e.target.value })}
                    placeholder="Required for XRP/TON/EOS or blank"
                    className="w-full p-3 bg-dark-900 border border-slate-700 rounded-xl text-white focus:border-gold-500 focus:outline-none text-xs"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-dark-900 rounded-xl border border-white/5">
                  <div>
                    <span className="font-bold text-white block">Active Receiving Status</span>
                    <span className="text-[11px] text-slate-400">When active, this address is presented to users for deposits.</span>
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
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl text-xs shadow-lg transition disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving Address...' : depositModal.isEdit ? 'Save Address Changes' : 'Create Deposit Address'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

        {/* 7. USER PASSWORD & CREDENTIALS MODAL */}
        {passModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
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
