import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft,
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Sparkles, 
  Headphones, 
  CheckCircle2, 
  RefreshCw,
  Wallet,
  Coins,
  Info,
  Copy,
  Check,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { API_BASE } from '../../config/api';

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenContact?: () => void;
  mainBalance?: number;
  profitBalance?: number;
}

interface MineCurrency {
  code: string;
  name: string;
  symbol: string;
  ratePerUsd: number;
  flag: string;
}

const LOCAL_MINE_CURRENCIES: MineCurrency[] = [
  { code: 'SGD', name: 'SGD Mine (Singapore Dollar)', symbol: 'S$', ratePerUsd: 1.35, flag: '🇸🇬' },
  { code: 'EUR', name: 'EUR Mine (Euro)', symbol: '€', ratePerUsd: 0.92, flag: '🇪🇺' },
  { code: 'GBP', name: 'GBP Mine (British Pound)', symbol: '£', ratePerUsd: 0.79, flag: '🇬🇧' },
  { code: 'CAD', name: 'CAD Mine (Canadian Dollar)', symbol: 'CA$', ratePerUsd: 1.38, flag: '🇨🇦' },
  { code: 'AUD', name: 'AUD Mine (Australian Dollar)', symbol: 'A$', ratePerUsd: 1.54, flag: '🇦🇺' },
  { code: 'JPY', name: 'JPY Mine (Japanese Yen)', symbol: '¥', ratePerUsd: 154.50, flag: '🇯🇵' },
  { code: 'CHF', name: 'CHF Mine (Swiss Franc)', symbol: 'CHF', ratePerUsd: 0.89, flag: '🇨🇭' },
  { code: 'AED', name: 'AED Mine (UAE Dirham)', symbol: 'AED', ratePerUsd: 3.67, flag: '🇦🇪' },
  { code: 'USD', name: 'USD Mine (US Dollar)', symbol: '$', ratePerUsd: 1.00, flag: '🇺🇸' },
];

export const ConvertModal: React.FC<ConvertModalProps> = ({ 
  isOpen, 
  onClose, 
  onOpenContact,
  mainBalance,
  profitBalance
}) => {
  const { user, profile, session } = useAuth();

  const [currentStep, setCurrentStep] = useState<'convert' | 'pending' | 'converted'>('convert');
  const [selectedCurrency, setSelectedCurrency] = useState<MineCurrency>(LOCAL_MINE_CURRENCIES[0]); // Default: SGD
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionRef, setConversionRef] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  // Balances & Settings
  const [fetchedMainBal, setFetchedMainBal] = useState<number>(0);
  const [fetchedProfitBal, setFetchedProfitBal] = useState<number>(0);
  const [gasFeeWallet, setGasFeeWallet] = useState<string>('0x71C8F39255C8F8F9898c8D455F55e7146522c09F');
  const [gasFeeNetwork, setGasFeeNetwork] = useState<string>('BNB Smart Chain (BEP20)');
  const [bnbPrice, setBnbPrice] = useState<number>(580.00);

  // Fetch balances, active gas/conversion fee wallet, and past conversion status
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const loadData = async () => {
      try {
        // 1. Fetch system gas fee settings
        const { data: settingsData } = await supabase
          .from('system_settings')
          .select('*');

        if (settingsData && settingsData.length > 0) {
          const gasSetting = settingsData.find((s: any) => s.key === 'gas_fee_address' || s.key === 'conversion_fee_address');
          if (gasSetting && gasSetting.value) {
            setGasFeeWallet(gasSetting.value);
            if (gasSetting.network) setGasFeeNetwork(gasSetting.network);
          }
        }

        // 2. Fetch latest user balances
        const { data: profData } = await supabase
          .from('profiles')
          .select('main_balance, profit_balance, convert_balance, convert_currency')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance, profit_balance')
          .eq('user_id', user.id)
          .maybeSingle();

        const { data: depData } = await supabase
          .from('deposits')
          .select('amount, status')
          .eq('user_id', user.id)
          .eq('status', 'APPROVED');

        const depSum = depData && depData.length > 0 
          ? depData.reduce((acc, d) => acc + Number(d.amount || 0), 0) 
          : 0;

        const resolvedMain = Number(profData?.main_balance || 0) > 0
          ? Number(profData?.main_balance)
          : (Number(walletData?.balance || 0) > 0 ? Number(walletData?.balance) : depSum);

        const resolvedProfit = Number(profData?.profit_balance || 0) > 0
          ? Number(profData?.profit_balance)
          : Number(walletData?.profit_balance || 0);

        setFetchedMainBal(resolvedMain);
        setFetchedProfitBal(resolvedProfit);

        // 3. Check for existing pending or converted requests
        const { data: convData } = await supabase
          .from('conversion_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (convData) {
          setConversionRef(convData.ref_code);
          const foundCurr = LOCAL_MINE_CURRENCIES.find(c => c.code === convData.target_currency);
          if (foundCurr) setSelectedCurrency(foundCurr);

          if (convData.status === 'CONVERTED') {
            setCurrentStep('converted');
          } else if (convData.status === 'PENDING') {
            setCurrentStep('pending');
          }
        }
      } catch (err) {
        console.warn('Error loading ConvertModal data:', err);
      }
    };

    loadData();
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  // Resolve Capital (Main Balance) and Profit Balance
  const effectiveMainBal = mainBalance !== undefined && mainBalance > 0
    ? mainBalance
    : (fetchedMainBal > 0 ? fetchedMainBal : Number(profile?.main_balance || 0));

  const effectiveProfitBal = profitBalance !== undefined && profitBalance > 0
    ? profitBalance
    : (fetchedProfitBal > 0 ? fetchedProfitBal : Number(profile?.profit_balance || 0));

  // Combined Total USD Mine (Capital + Profit)
  const totalUsdMine = +(effectiveMainBal + effectiveProfitBal).toFixed(2);

  // Converted Gross Value in Target Currency
  const convertedValue = +(totalUsdMine * selectedCurrency.ratePerUsd).toFixed(2);

  // 20% Conversion Fee Calculations
  const conversionFeeUsd = +(totalUsdMine * 0.20).toFixed(2);
  const conversionFeeBnb = +(conversionFeeUsd / bnbPrice).toFixed(4);

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(gasFeeWallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConvert = async () => {
    setIsConverting(true);
    const refCode = `QB-MINE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setConversionRef(refCode);

    try {
      // 1. Submit conversion request to API / database
      const token = session?.access_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`${API_BASE}/conversions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          usdMineAmount: totalUsdMine,
          targetCurrency: selectedCurrency.code,
          convertedAmount: convertedValue,
          exchangeRate: selectedCurrency.ratePerUsd,
          conversionFeeUsd,
          conversionFeeBnb,
          feeWalletAddress: gasFeeWallet,
          refCode
        })
      });
    } catch (err) {
      console.warn('Error submitting conversion request:', err);
    } finally {
      setIsConverting(false);
      setCurrentStep('pending');
    }
  };

  const handleOpenLiveChat = () => {
    if (typeof (window as any).smartsupp !== 'undefined') {
      (window as any).smartsupp('chat:show');
      (window as any).smartsupp('chat:open');
    }
    if (onOpenContact) {
      onOpenContact();
    }
  };

  const handleReset = () => {
    setCurrentStep('convert');
    setIsFolderOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-dark-900 via-dark-950 to-slate-950 border border-gold-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        
        {/* Ambient background glows */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Mine Currency Conversion</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300 border border-gold-400/20">
                  Treasury Payout
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {currentStep === 'convert' && 'Convert Total USD Mine to Local Mine Currency'}
                {currentStep === 'pending' && 'Conversion Status: Pending Admin Approval'}
                {currentStep === 'converted' && 'Conversion Approved & Settled'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 space-y-5 overflow-y-auto pr-1 flex-1">
          
          {/* ================= STEP 1: CONVERSION OVERVIEW & 20% BNB FEE ================= */}
          {currentStep === 'convert' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Total USD Mine Balance Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-dark-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-gold-400" />
                    <span>Your Total USD Mine</span>
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-black text-white font-mono tracking-tight">
                    ${totalUsdMine.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">USD Mine</span>
                </div>
              </div>

              {/* Conversion Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Conversion Amount (USD Mine)</label>
                <input
                  type="text"
                  readOnly
                  value={`$${totalUsdMine.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD Mine`}
                  className="w-full py-3 px-4 bg-dark-950/90 border border-slate-700/80 rounded-xl text-white font-mono text-base font-bold cursor-not-allowed select-none opacity-90 shadow-inner"
                />
              </div>

              {/* Local Currency Mine Folder Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">Target Local Currency Mine</label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Rate: 1 USD Mine ≈ {selectedCurrency.symbol} {selectedCurrency.ratePerUsd}
                  </span>
                </div>

                {/* Folder Header / Selected Box */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFolderOpen(!isFolderOpen)}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900/90 border border-gold-500/40 hover:border-gold-400 flex items-center justify-between transition-all group shadow-sm text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{selectedCurrency.flag}</span>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-gold-300 transition-colors flex items-center gap-2">
                          <span>{selectedCurrency.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {selectedCurrency.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Current Rate: 1 USD = {selectedCurrency.symbol} {selectedCurrency.ratePerUsd}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-slate-400 group-hover:text-gold-400 transition-colors">
                      <span className="text-xs font-semibold hidden sm:inline">
                        {isFolderOpen ? 'Hide Options' : 'Browse All'}
                      </span>
                      {isFolderOpen ? <ChevronUp className="w-5 h-5 text-gold-400" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {/* Folder Dropdown Content */}
                  {isFolderOpen && (
                    <div className="mt-2 p-2 bg-dark-950/95 border border-slate-700/80 rounded-2xl shadow-2xl space-y-1 max-h-52 overflow-y-auto animate-fadeIn z-20 backdrop-blur-lg">
                      <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800/80">
                        <span>Select Target Local Currency Mine</span>
                        <span>Exchange Rate</span>
                      </div>
                      {LOCAL_MINE_CURRENCIES.map((curr) => {
                        const isSelected = curr.code === selectedCurrency.code;
                        return (
                          <button
                            key={curr.code}
                            type="button"
                            onClick={() => {
                              setSelectedCurrency(curr);
                              setIsFolderOpen(false);
                            }}
                            className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
                              isSelected
                                ? 'bg-gold-500/15 border border-gold-400/40 text-gold-300'
                                : 'hover:bg-slate-800/60 text-slate-300 hover:text-white border border-transparent'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <span className="text-xl">{curr.flag}</span>
                              <div>
                                <div className="text-xs font-bold">{curr.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{curr.code} Mine</div>
                              </div>
                            </div>

                            <div className="text-right font-mono">
                              <div className="text-xs font-bold text-slate-200">
                                {curr.symbol} {curr.ratePerUsd}
                              </div>
                              <span className="text-[10px] text-slate-500">per 1 USD</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ESTIMATED GROSS CONVERSION Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-dark-900 to-teal-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold block">
                    ESTIMATED GROSS CONVERSION
                  </span>
                  <div className="text-2xl font-black text-white font-mono tracking-tight mt-0.5">
                    {selectedCurrency.symbol} {convertedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold text-emerald-400">{selectedCurrency.code} Mine</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              {/* 20% CONVERSION FEE (BNB) CARD & CONVERSION DOMAIN PAYMENT WALLET */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 font-mono">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>20% Conversion Fee (BNB)</span>
                  </span>
                  <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    {conversionFeeBnb} BNB
                  </span>
                </div>

                <div className="p-3 bg-dark-950/80 rounded-xl border border-amber-500/20 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300 font-mono">
                    <span>Conversion Fee:</span>
                    <strong className="text-amber-300">${conversionFeeUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</strong>
                  </div>
                  <div className="flex justify-between text-slate-300 font-mono">
                    <span>Payable in BNB:</span>
                    <strong className="text-amber-300 font-bold">{conversionFeeBnb} BNB</strong>
                  </div>
                </div>

                {/* Important Notice Regarding Payment to Conversion Domain */}
                <div className="text-[11px] text-amber-200/90 leading-relaxed bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/20">
                  <p className="font-bold text-amber-300 mb-0.5">⚠️ TRANSFER THE CONVERSION FEE TO YOUR MINE PAYOUT ADDRESS</p>
                  <p>
                    Please transfer the conversion fee to the designated wallet address below to complete your conversion.
                  </p>
                </div>

                {/* Conversion Fee Wallet Address */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>CONVERSION FEE WALLET ADDRESS ({gasFeeNetwork})</span>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-dark-950 border border-slate-700/80 rounded-xl">
                    <span className="font-mono text-xs text-amber-300 truncate flex-1 select-all">
                      {gasFeeWallet}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyWallet}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Conversion Action Button */}
              <button
                type="button"
                onClick={handleConvert}
                disabled={isConverting || totalUsdMine <= 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-gold-400 via-amber-500 to-amber-600 hover:from-gold-500 hover:to-amber-700 text-dark-950 font-black text-sm tracking-wide shadow-gold transition-all flex items-center justify-center space-x-2 transform active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-dark-950" />
                    <span>PROCESSING CONVERSION PROTOCOL...</span>
                  </>
                ) : (
                  <>
                    <span>CONVERT TO {selectedCurrency.code} MINE</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ================= STEP 2: CONVERSION PENDING STATE ================= */}
          {currentStep === 'pending' && (
            <div className="space-y-5 animate-fadeIn text-center py-2">
              
              {/* Status Graphic */}
              <div className="relative mx-auto w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
                <Clock className="w-10 h-10 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-dark-950">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 inline-block">
                  STATUS: PENDING VERIFICATION
                </span>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Conversion Request Submitted
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Your conversion of <strong className="text-white">${totalUsdMine.toLocaleString()} USD Mine</strong> to <strong className="text-gold-300">{selectedCurrency.symbol} {convertedValue.toLocaleString()} {selectedCurrency.code} Mine</strong> is currently pending fee verification and administrator approval.
                </p>
              </div>

              {/* Details Container */}
              <div className="p-4 rounded-2xl bg-dark-900/90 border border-slate-800 text-left space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Settlement Ref Code:</span>
                  <span className="font-bold text-gold-400">{conversionRef}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Target Currency:</span>
                  <span className="font-bold text-slate-200">{selectedCurrency.name}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Converted Gross Amount:</span>
                  <span className="font-bold text-emerald-400">
                    {selectedCurrency.symbol} {convertedValue.toLocaleString()} {selectedCurrency.code} Mine
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Fee Payable:</span>
                  <span className="font-bold text-amber-300">{conversionFeeBnb} BNB (${conversionFeeUsd})</span>
                </div>
              </div>

              {/* Fee Payment Reminder Box */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2 text-xs">
                <p className="font-bold text-amber-300">Mine Payout Conversion Fee Transfer Address:</p>
                <div className="flex items-center gap-2 p-2 bg-dark-950 rounded-lg border border-slate-700">
                  <span className="font-mono text-[11px] text-amber-300 truncate flex-1">{gasFeeWallet}</span>
                  <button
                    type="button"
                    onClick={handleCopyWallet}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Contact Support for Assistance Button */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleOpenLiveChat}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2.5 transform active:scale-98 cursor-pointer"
                >
                  <Headphones className="w-5 h-5" />
                  <span>CONTACT SUPPORT FOR ASSISTANCE ON CONVERSION</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center space-x-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to New Conversion</span>
                </button>
              </div>

            </div>
          )}

          {/* ================= STEP 3: CONVERTED / APPROVED STATE ================= */}
          {currentStep === 'converted' && (
            <div className="space-y-5 animate-fadeIn text-center py-2">
              
              <div className="relative mx-auto w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-dark-950">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-block">
                  STATUS: CONVERTED
                </span>
                <h3 className="text-xl font-black text-white tracking-tight">
                  Converted! Please check your convert balance to see your assets.
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Your conversion request has been officially approved by the treasury administrator. The converted funds are now credited to your Convert Balance.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ref Code:</span>
                  <span className="font-bold text-gold-400">{conversionRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Settled Asset:</span>
                  <span className="font-bold text-emerald-300">{selectedCurrency.name}</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm shadow-md"
                >
                  View Convert Balance on Dashboard
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2 text-xs text-slate-400 hover:text-white"
                >
                  Start Another Conversion
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Security Badge */}
        <div className="relative z-10 pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Multi-Sig Treasury Vault • Instant Routing</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">256-Bit SSL Encrypted</span>
        </div>

      </div>
    </div>
  );
};
