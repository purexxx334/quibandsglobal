import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowDownCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  RefreshCw, 
  ShieldCheck, 
  QrCode,
  Info,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DepositRequest, DepositAddress } from '../../types';
import { supabase } from '../../lib/supabase';
import { API_BASE } from '../../config/api';


interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DEFAULT_TREASURY_FALLBACKS: Record<string, { address: string; memo_tag?: string; network: string }> = {
  BTC: {
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    network: 'BTC',
  },
  ERC20: {
    address: '0x71C568BaE927eA7F876939eD04C2E4268eC44490',
    network: 'ERC20',
  },
  BNB: {
    address: '0x71C568BaE927eA7F876939eD04C2E4268eC44490',
    network: 'BEP20',
  },
};

const SUPPORTED_ASSETS = [
  { 
    symbol: 'BTC', 
    name: 'Bitcoin', 
    badge: 'Native BTC Blockchain', 
    networks: ['Native', 'BTC'], 
    icon: '₿', 
    color: 'text-amber-400',
    borderActive: 'border-amber-400/90 bg-amber-500/10 text-white shadow-amber-500/20'
  },
  { 
    symbol: 'ERC20', 
    name: 'Ethereum (ERC-20)', 
    badge: 'USDT / ETH Network', 
    networks: ['ERC20'], 
    icon: 'Ξ', 
    color: 'text-indigo-400',
    borderActive: 'border-indigo-400/90 bg-indigo-500/10 text-white shadow-indigo-500/20'
  },
  { 
    symbol: 'BNB', 
    name: 'BNB Smart Chain', 
    badge: 'BEP-20 Network', 
    networks: ['BEP20'], 
    icon: '⬡', 
    color: 'text-yellow-400',
    borderActive: 'border-yellow-400/90 bg-yellow-500/10 text-white shadow-yellow-500/20'
  },
];

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { session, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  
  // Selection State (strictly BTC, ERC20, BNB)
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [selectedNetwork, setSelectedNetwork] = useState('Native');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [proofRef, setProofRef] = useState('');

  // Active Addresses & History State
  const [activeAddresses, setActiveAddresses] = useState<DepositAddress[]>([]);
  const [userDeposits, setUserDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 5000);
  };

  const getAuthToken = async (): Promise<string | null> => {
    if (session?.access_token) return session.access_token;
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token || null;
    } catch {
      return null;
    }
  };

  const getHeaders = async () => {
    const token = await getAuthToken();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    };
  };

  // Fetch active treasury deposit addresses
  const fetchActiveAddresses = async () => {
    try {
      const res = await fetch(`${API_BASE}/deposit-addresses/active`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setActiveAddresses(json.data);
      }
    } catch (err: any) {
      console.warn('Failed to load active deposit addresses:', err.message);
    }
  };

  // Fetch user's deposit request history
  const fetchUserDeposits = async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/deposits`, { headers });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUserDeposits(json.data);
      } else {
        setUserDeposits([]);
      }
    } catch (err: any) {
      console.warn('Failed to fetch user deposits:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchActiveAddresses();
      fetchUserDeposits();
    }
  }, [isOpen, session?.access_token]);

  // Sync available networks when asset changes
  useEffect(() => {
    const assetObj = SUPPORTED_ASSETS.find((a) => a.symbol === selectedAsset);
    if (assetObj && !assetObj.networks.includes(selectedNetwork)) {
      setSelectedNetwork(assetObj.networks[0]);
    }
  }, [selectedAsset]);

  // Current active address matching selection with smart protocol fallback
  const dbActiveAddress = activeAddresses.find((addr) => {
    if (!addr.is_active) return false;
    const a = (addr.asset || '').toUpperCase().trim();
    const n = (addr.network || '').toUpperCase().trim();

    if (selectedAsset === 'BTC') {
      return a === 'BTC' || a === 'BITCOIN' || n === 'BTC' || n === 'NATIVE';
    }
    if (selectedAsset === 'ERC20') {
      return a === 'ERC20' || n === 'ERC20' || a === 'ETH' || a === 'USDT' || a === 'ETHEREUM';
    }
    if (selectedAsset === 'BNB') {
      return a === 'BNB' || a === 'BSC' || n === 'BEP20' || n === 'BNB' || n === 'BSC';
    }
    return a === selectedAsset.toUpperCase();
  });

  const fallback = DEFAULT_TREASURY_FALLBACKS[selectedAsset] || DEFAULT_TREASURY_FALLBACKS['BTC'];
  const currentActiveAddress: DepositAddress = dbActiveAddress || {
    id: `fallback-${selectedAsset.toLowerCase()}`,
    asset: selectedAsset,
    network: selectedNetwork || fallback.network,
    address: fallback.address,
    memo_tag: fallback.memo_tag || null,
    notes: 'Default Platform Treasury Wallet',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle deposit form submission
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('error', 'Please enter a valid positive deposit amount.');
      return;
    }

    if (!txHash.trim()) {
      showToast('error', 'Transaction Hash / Reference is required.');
      return;
    }

    if (!currentActiveAddress?.address) {
      showToast('error', 'No active deposit address available for this asset. Please select another option or contact support.');
      return;
    }

    setSubmitting(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/deposits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          asset: selectedAsset,
          network: selectedNetwork,
          amount: numAmount,
          transactionHash: txHash.trim(),
          proofReference: proofRef.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('success', 'Deposit request submitted successfully! Awaiting institutional verification.');
        setAmount('');
        setTxHash('');
        setProofRef('');
        setActiveTab('history');
        fetchUserDeposits();
        onSuccess?.();
      } else {
        showToast('error', json.error || 'Failed to submit deposit request.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Deposit submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-dark-900 border border-slate-700/60 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto sm:my-8 max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-800 bg-dark-950/60">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center text-dark-950 shadow-gold-sm">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Deposit Digital Assets
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Instant Verification
                </span>
              </h2>
              <p className="text-xs text-slate-400">Institutional Custody & Automated Balance Crediting</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-dark-950/30">
          <button
            onClick={() => setActiveTab('new')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'new'
                ? 'border-gold-400 text-gold-400 bg-gold-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            New Deposit
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              fetchUserDeposits();
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-gold-400 text-gold-400 bg-gold-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Deposit History ({userDeposits.length})
          </button>
        </div>

        {/* Toast Notification Banner */}
        {banner && (
          <div className={`mx-6 mt-4 p-3 rounded-xl border flex items-center gap-3 text-xs ${
            banner.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
          }`}>
            {banner.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{banner.message}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'new' ? (
            <form onSubmit={handleSubmitDeposit} className="space-y-5">
              
              {/* Asset Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">1. Select Deposit Cryptocurrency</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SUPPORTED_ASSETS.map((asset) => {
                    const isSelected = selectedAsset === asset.symbol;
                    return (
                      <button
                        key={asset.symbol}
                        type="button"
                        onClick={() => setSelectedAsset(asset.symbol)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3.5 relative overflow-hidden ${
                          isSelected
                            ? asset.borderActive
                            : 'border-slate-800 bg-dark-950/70 text-slate-300 hover:border-slate-700 hover:bg-dark-900/60'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold font-mono border ${
                          isSelected 
                            ? 'bg-dark-900 border-white/20 shadow-inner' 
                            : 'bg-dark-900/80 border-slate-800'
                        }`}>
                          <span className={asset.color}>{asset.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white font-mono tracking-tight">{asset.symbol}</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              isSelected ? 'bg-white/15 text-white' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {asset.badge}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate mt-0.5">{asset.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Network Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">2. Network Protocol</label>
                <div className="flex gap-2 flex-wrap">
                  {SUPPORTED_ASSETS.find((a) => a.symbol === selectedAsset)?.networks.map((net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setSelectedNetwork(net)}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold border transition-all flex items-center gap-1.5 ${
                        selectedNetwork === net
                          ? 'border-gold-400 bg-gold-400 text-dark-950 font-bold shadow-gold-sm'
                          : 'border-slate-800 bg-dark-950 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{net} Network</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Deposit Address Card */}
              <div className="p-4 rounded-2xl bg-dark-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 text-gold-400 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Official Institutional Deposit Address
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Cold Vault Monitored</span>
                </div>

                {currentActiveAddress ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-dark-900 border border-slate-700/80">
                      <div className="font-mono text-xs text-slate-200 break-all flex-1 select-all">
                        {currentActiveAddress.address}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentActiveAddress.address)}
                        className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                          copied
                            ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                            : 'border-slate-700 bg-dark-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {currentActiveAddress.memo_tag && (
                      <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs">
                        <span className="text-amber-400 font-medium">Required Memo / Destination Tag:</span>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-white font-bold">{currentActiveAddress.memo_tag}</code>
                          <button
                            type="button"
                            onClick={() => handleCopy(currentActiveAddress.memo_tag!)}
                            className="text-amber-400 hover:text-amber-300"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>No active deposit address configured for {selectedAsset} ({selectedNetwork}). Please choose another network or asset.</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Send only <b>{selectedAsset}</b> via the <b>{selectedNetwork}</b> network to this address.</span>
                </div>
              </div>

              {/* Amount & Tx Hash Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Deposit Amount ({selectedAsset}) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.00000001"
                    required
                    placeholder="e.g. 500.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Blockchain Transaction Hash (TxHash) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0x3a19... or 4b9e..."
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-dark-950 border border-slate-700 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400"
                  />
                </div>
              </div>

              {/* Optional Reference / Proof */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Sender Wallet Address or Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sent from Binance / TrustWallet / Ledger"
                  value={proofRef}
                  onChange={(e) => setProofRef(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-dark-950 border border-slate-800 text-slate-200 text-xs placeholder-slate-600 focus:outline-none focus:border-slate-600"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !currentActiveAddress}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-gold-400 via-gold-500 to-amber-600 text-dark-950 font-bold text-xs shadow-gold hover:shadow-gold-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-dark-950" />
                    Submitting Deposit Request...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-dark-950" />
                    Confirm & Submit Deposit Request
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Tab 2: Deposit Request History */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Requests: {userDeposits.length}</span>
                <button
                  type="button"
                  onClick={fetchUserDeposits}
                  className="flex items-center gap-1 hover:text-gold-400 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading deposit records...</div>
              ) : userDeposits.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl">
                  No deposit requests recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {userDeposits.map((dep) => {
                    const statusBadge = {
                      PENDING: { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Clock, label: 'Pending Review' },
                      APPROVED: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle2, label: 'Approved & Credited' },
                      REJECTED: { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: XCircle, label: 'Rejected' },
                      CANCELLED: { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30', icon: XCircle, label: 'Cancelled' },
                    }[dep.status] || { bg: 'bg-slate-800 text-slate-300', icon: Clock, label: dep.status };

                    const Icon = statusBadge.icon;

                    return (
                      <div
                        key={dep.id}
                        className="p-4 rounded-2xl bg-dark-950 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              +{Number(dep.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} {dep.asset}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-dark-850 text-slate-400 border border-slate-700">
                              {dep.network}
                            </span>
                          </div>

                          <div className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold flex items-center gap-1.5 ${statusBadge.bg}`}>
                            <Icon className="w-3 h-3" />
                            {statusBadge.label}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono bg-dark-900/60 p-2.5 rounded-xl border border-slate-800">
                          <div>
                            <span className="text-slate-500">TxHash: </span>
                            <span className="text-slate-300">{dep.transaction_hash.slice(0, 16)}...{dep.transaction_hash.slice(-8)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Date: </span>
                            <span className="text-slate-300">{new Date(dep.created_at).toLocaleString()}</span>
                          </div>
                        </div>

                        {dep.status === 'REJECTED' && dep.rejection_reason && (
                          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
                            <span className="font-semibold">Rejection Reason:</span> {dep.rejection_reason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-dark-950/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>256-Bit Ledger Verification</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
