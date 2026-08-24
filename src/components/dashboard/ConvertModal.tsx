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
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

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
  const { user, profile } = useAuth();

  const [currentStep, setCurrentStep] = useState<'convert' | 'contact'>('convert');
  const [selectedCurrency, setSelectedCurrency] = useState<MineCurrency>(LOCAL_MINE_CURRENCIES[0]); // Default: SGD
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionRef, setConversionRef] = useState<string>('');
  const [fetchedMainBal, setFetchedMainBal] = useState<number>(0);
  const [fetchedProfitBal, setFetchedProfitBal] = useState<number>(0);

  // Fetch latest capital & profit balances from wallets or approved deposits if not passed
  useEffect(() => {
    if (!isOpen || !user?.id) return;
    const fetchLatestBalances = async () => {
      try {
        // 1. Fetch from profiles
        const { data: profData } = await supabase
          .from('profiles')
          .select('main_balance, profit_balance')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        // 2. Fetch from wallets table
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance, profit_balance')
          .eq('user_id', user.id)
          .maybeSingle();

        // 3. Fetch from approved deposits
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
      } catch (err) {
        console.warn('Error fetching balances in ConvertModal:', err);
      }
    };
    fetchLatestBalances();
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

  // Converted value
  const convertedValue = +(totalUsdMine * selectedCurrency.ratePerUsd).toFixed(2);

  const handleConvert = () => {
    setIsConverting(true);
    const refCode = `QB-MINE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setConversionRef(refCode);

    setTimeout(() => {
      setIsConverting(false);
      setCurrentStep('contact');
    }, 600);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-dark-900 via-dark-950 to-slate-950 border border-gold-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Ambient background glows */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
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
                {currentStep === 'convert' ? 'Convert Total USD Mine to Local Mine Currency' : 'Conversion Initiated • Contact Support'}
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
        <div className="relative z-10 space-y-6 overflow-y-auto pr-1 flex-1">
          
          {/* STEP 1: CONVERT USD MINE TO LOCAL CURRENCY MINE */}
          {currentStep === 'convert' && (
            <div className="space-y-6 animate-fadeIn">
              
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
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">Conversion Amount (USD Mine)</label>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={`$${totalUsdMine.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD Mine`}
                    className="w-full py-3.5 px-4 bg-dark-950/90 border border-slate-700/80 rounded-xl text-white font-mono text-base font-bold cursor-not-allowed select-none opacity-90 shadow-inner"
                  />
                </div>
              </div>

              {/* Local Currency Mine Folder Selector */}
              <div className="space-y-2">
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
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-900/90 border border-gold-500/40 hover:border-gold-400 flex items-center justify-between transition-all group shadow-sm text-left"
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
                    <div className="mt-2 p-2 bg-dark-950/95 border border-slate-700/80 rounded-2xl shadow-2xl space-y-1 max-h-56 overflow-y-auto animate-fadeIn z-20 backdrop-blur-lg">
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

              {/* Converted Estimation Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-dark-900 to-teal-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold block">
                    Estimated Gross Conversion
                  </span>
                  <div className="text-2xl font-black text-white font-mono tracking-tight mt-0.5">
                    {selectedCurrency.symbol} {convertedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-semibold text-emerald-400">{selectedCurrency.code} Mine</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-5 h-5" />
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

          {/* STEP 2: CONVERSION INITIATED • CONTACT SUPPORT PAGE */}
          {currentStep === 'contact' && (
            <div className="space-y-6 animate-fadeIn text-center py-2">
              
              {/* Status Graphic */}
              <div className="relative mx-auto w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-dark-950">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight">
                  Mine Currency Conversion Initiated
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Your Total USD Mine portfolio of <strong className="text-white">${totalUsdMine.toLocaleString()}</strong> has been submitted for conversion to <strong className="text-gold-300">{selectedCurrency.symbol} {convertedValue.toLocaleString()} {selectedCurrency.code} Mine</strong>.
                </p>
              </div>

              {/* Reference Details Container */}
              <div className="p-4 rounded-2xl bg-dark-900/90 border border-slate-800 text-left space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Settlement Ref Code:</span>
                  <span className="font-bold text-gold-400">{conversionRef}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Target Currency:</span>
                  <span className="font-bold text-slate-200">{selectedCurrency.name}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Converted Amount:</span>
                  <span className="font-bold text-emerald-400">
                    {selectedCurrency.symbol} {convertedValue.toLocaleString()} {selectedCurrency.code} Mine
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Routing Status:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    AWAITING SUPPORT VERIFICATION
                  </span>
                </div>
              </div>

              {/* Support Instructions Box */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left flex items-start space-x-3">
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed space-y-1">
                  <p className="font-bold text-amber-300">Action Required to Complete Conversion:</p>
                  <p>
                    Please contact institutional customer support immediately to finalize and authorize your local currency mine payout.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleOpenLiveChat}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2.5 transform active:scale-98 cursor-pointer"
                >
                  <Headphones className="w-5 h-5" />
                  <span>CONTACT SUPPORT TO CONTINUE</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center space-x-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Conversion Overview</span>
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
