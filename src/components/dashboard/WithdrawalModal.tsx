import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft,
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Sparkles, 
  Headphones, 
  MessageSquare, 
  CheckCircle2, 
  RefreshCw,
  Wallet,
  Coins,
  Lock,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenContact?: () => void;
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

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, onOpenContact }) => {
  const { user, profile } = useAuth();

  const [currentStep, setCurrentStep] = useState<'convert' | 'contact'>('convert');
  const [selectedCurrency, setSelectedCurrency] = useState<MineCurrency>(LOCAL_MINE_CURRENCIES[0]); // Default: SGD
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionRef, setConversionRef] = useState<string>('');
  const [walletBal, setWalletBal] = useState<number>(0);

  // Fetch latest capital / wallet balance from wallets or approved deposits
  React.useEffect(() => {
    if (!isOpen || !user?.id) return;
    const fetchLatestBalances = async () => {
      try {
        // 1. Check wallets table
        const { data: walletData } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle();

        if (walletData && walletData.balance !== null && walletData.balance !== undefined && Number(walletData.balance) > 0) {
          setWalletBal(Number(walletData.balance));
        } else {
          // 2. Check approved deposits
          const { data: depData } = await supabase
            .from('deposits')
            .select('amount, status')
            .eq('user_id', user.id)
            .eq('status', 'APPROVED');

          if (depData && depData.length > 0) {
            const sum = depData.reduce((acc, d) => acc + Number(d.amount || 0), 0);
            setWalletBal(sum);
          }
        }
      } catch (err) {
        console.warn('Error fetching wallet balance in WithdrawalModal:', err);
      }
    };
    fetchLatestBalances();
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  // Calculate Total USD Mine (Capital / Main Balance + Profit Balance)
  const profileMainBal = Number(profile?.main_balance !== undefined ? profile.main_balance : 0);
  const mainBal = profileMainBal > 0 ? profileMainBal : walletBal;
  const profitBal = Number(profile?.profit_balance !== undefined ? profile.profit_balance : 0);
  const totalUsdMine = +(mainBal + profitBal).toFixed(2);

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
                    Rate: 1 USD = {selectedCurrency.ratePerUsd} {selectedCurrency.code}
                  </span>
                </div>

                {/* Primary Selected Box & Folder Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFolderOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between p-3.5 bg-dark-950/90 border border-gold-500/40 hover:border-gold-400 rounded-xl transition-all text-left shadow-lg group"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{selectedCurrency.flag}</span>
                      <div>
                        <div className="font-bold text-white text-sm group-hover:text-gold-300 transition-colors">
                          {selectedCurrency.name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          Exchange Rate: 1 USD &rarr; {selectedCurrency.symbol}{selectedCurrency.ratePerUsd} {selectedCurrency.code} Mine
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 text-gold-400 bg-gold-400/10 px-2.5 py-1 rounded-lg border border-gold-400/20 text-xs font-bold font-mono">
                      <span>{isFolderOpen ? 'Hide' : 'Select'}</span>
                      {isFolderOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Folder / Collapsible Currency List */}
                  {isFolderOpen && (
                    <div className="mt-2 p-2 bg-dark-950 border border-slate-700 rounded-2xl shadow-2xl space-y-1 max-h-56 overflow-y-auto animate-fadeIn z-20">
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        Available Local Currency Mines
                      </div>
                      {LOCAL_MINE_CURRENCIES.map((cur) => {
                        const isSelected = cur.code === selectedCurrency.code;
                        return (
                          <button
                            key={cur.code}
                            type="button"
                            onClick={() => {
                              setSelectedCurrency(cur);
                              setIsFolderOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                              isSelected
                                ? 'bg-gold-500/15 border border-gold-500/40 text-gold-300'
                                : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <span className="text-xl">{cur.flag}</span>
                              <div>
                                <span className="font-bold text-xs block text-white">{cur.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  1 USD = {cur.symbol}{cur.ratePerUsd} {cur.code} Mine
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-mono font-bold text-gold-400 bg-gold-400/20 px-2 py-0.5 rounded">
                                ACTIVE
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Conversion Result Preview Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-dark-900 to-teal-950/40 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Estimated Converted Yield</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">Instant Execution</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  {selectedCurrency.symbol} {convertedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base font-bold text-emerald-300">{selectedCurrency.code} Mine</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Conversion applied at current real-time rate ({selectedCurrency.ratePerUsd} {selectedCurrency.code} per 1 USD Mine).
                </p>
              </div>

              {/* Convert CTA Button */}
              <button
                type="button"
                onClick={handleConvert}
                disabled={isConverting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-gold-500 via-amber-500 to-yellow-500 hover:from-gold-600 hover:to-amber-600 text-dark-950 font-black text-sm tracking-wide shadow-xl shadow-gold-500/20 transition-all flex items-center justify-center gap-2 transform active:scale-98 disabled:opacity-50"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-dark-950" />
                    <span>Converting to {selectedCurrency.code} Mine...</span>
                  </>
                ) : (
                  <>
                    <span>Convert to {selectedCurrency.code} Mine</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </div>
          )}

          {/* STEP 2: CONTACT SUPPORT NOTICE */}
          {currentStep === 'contact' && (
            <div className="space-y-6 animate-fadeIn text-center py-2">
              
              {/* Success / Pending Shield Icon */}
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>

              {/* Main Heading */}
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Mine Conversion Initiated
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Your <strong className="text-gold-400">${totalUsdMine.toLocaleString()} USD Mine</strong> has been locked and processed into <strong className="text-emerald-400">{selectedCurrency.symbol}{convertedValue.toLocaleString()} {selectedCurrency.code} Mine</strong>.
                </p>
              </div>

              {/* Conversion Reference Card */}
              <div className="p-4 rounded-2xl bg-dark-900/90 border border-slate-800 text-left space-y-2 max-w-md mx-auto font-mono">
                <div className="flex justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span>Protocol Reference:</span>
                  <strong className="text-gold-400">{conversionRef}</strong>
                </div>
                <div className="flex justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span>Converted Amount:</span>
                  <strong className="text-emerald-400">{selectedCurrency.symbol}{convertedValue.toLocaleString()} {selectedCurrency.code} Mine</strong>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Settlement Status:</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Awaiting Support Verification</span>
                  </span>
                </div>
              </div>

              {/* Informative Guidance Banner */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start space-x-3 text-left max-w-md mx-auto">
                <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  To proceed with your settlement and finalize payout disbursement to your designated bank or wallet, please contact institutional support.
                </p>
              </div>

              {/* Support & Action Buttons */}
              <div className="space-y-3 max-w-md mx-auto pt-2">
                <button
                  type="button"
                  onClick={handleOpenLiveChat}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-sm tracking-wide shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 transform active:scale-98"
                >
                  <Headphones className="w-5 h-5" />
                  <span>Contact Support to Continue</span>
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
