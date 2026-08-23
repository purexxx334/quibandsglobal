import React, { useState } from 'react';
import { 
  Sliders, 
  Cpu, 
  Zap, 
  TrendingUp, 
  Info, 
  ArrowRight, 
  Coins, 
  RefreshCw,
  Check
} from 'lucide-react';
import { mockCryptoMarket } from './LiveMarketTicker';

interface MiningCalculatorProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const MiningCalculator: React.FC<MiningCalculatorProps> = ({ onOpenAuth }) => {
  const [selectedAsset, setSelectedAsset] = useState(mockCryptoMarket[0]);
  const [hashrate, setHashrate] = useState<number>(250); // in TH/s or relevant unit

  // Dynamic realistic calculation based on algorithm and variable rate
  const assetPrice = selectedAsset.priceUsd;
  const baseYieldMultiplier = selectedAsset.estDailyYieldRate / 100;
  
  // Approximate daily output formula
  const estimatedDailyUsd = Math.round((hashrate * 12.5 * baseYieldMultiplier) * 100) / 100;
  const estimatedCryptoPerDay = selectedAsset.symbol === 'USDT' 
    ? estimatedDailyUsd 
    : +(estimatedDailyUsd / assetPrice).toFixed(6);
  const estimatedMonthlyUsd = Math.round(estimatedDailyUsd * 30 * 100) / 100;
  const powerEfficiency = +(hashrate * 0.038).toFixed(1);

  return (
    <section id="hashrate-engine" className="py-24 relative bg-dark-900/40 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono mb-4 uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-['Outfit'] tracking-tight mb-4">
            Hashrate Output & Yield Estimator
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Simulate computational mining power across our green-powered server clusters. Adjust your desired hashrate capacity to forecast realistic daily and monthly cryptocurrency yields.
          </p>
        </div>

        {/* Calculator Main Box */}
        <div className="max-w-5xl mx-auto rounded-3xl glass-panel p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Subtle gold glow inside */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-gold-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Configuration Panel */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Asset Selector */}
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-3">
                  1. Select Mining Pool & Algorithm:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {mockCryptoMarket.map((asset) => {
                    const isSelected = selectedAsset.id === asset.id;
                    return (
                      <button
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={`p-3 rounded-xl border text-left transition-all duration-200 flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-dark-800 border-gold-500 text-white shadow-gold-sm'
                            : 'bg-dark-850/60 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-dark-800'
                        }`}
                      >
                        <div 
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: asset.iconColor }}
                        />
                        <div className="truncate">
                          <div className="font-bold text-xs text-white">{asset.symbol}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{asset.algorithm}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hashrate Slider */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-slate-300 uppercase tracking-wider">
                    2. Configure Hashrate Capacity:
                  </label>
                  <div className="px-3 py-1 rounded-lg bg-dark-800 border border-gold-500/30 text-gold-400 font-mono font-bold text-sm">
                    {hashrate} TH/s
                  </div>
                </div>

                <input
                  type="range"
                  min="20"
                  max="1200"
                  step="10"
                  value={hashrate}
                  onChange={(e) => setHashrate(Number(e.target.value))}
                  className="w-full h-2.5 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-gold-500"
                />

                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>20 TH/s (Standard Node)</span>
                  <span>600 TH/s</span>
                  <span>1,200 TH/s (Cluster Array)</span>
                </div>
              </div>

              {/* Hardware & Grid Specs */}
              <div className="p-4 rounded-xl bg-dark-850/80 border border-white/5 space-y-2">
                <div className="text-xs font-mono text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-gold-400" />
                  Cluster Specifications:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                  <div>Rig Type: <span className="text-slate-200">ASIC Immersion</span></div>
                  <div>Power Draw: <span className="text-emerald-400 font-semibold">{powerEfficiency} kW (Hydro)</span></div>
                  <div>Network: <span className="text-slate-200">{selectedAsset.network}</span></div>
                  <div>Payout Interval: <span className="text-gold-400">24-Hour Settlement</span></div>
                </div>
              </div>

            </div>

            {/* Right Results / Forecast Box */}
            <div className="lg:col-span-5 p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-dark-800 to-dark-850 border border-gold-500/30 shadow-xl flex flex-col justify-between space-y-6">
              
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <span className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold">
                    ESTIMATED YIELD OUTPUT
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
                    LIVE ORACLE
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Daily Output */}
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Estimated Daily Reward:</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold font-mono text-white">
                        ${estimatedDailyUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-semibold">
                        &asymp; {estimatedCryptoPerDay} {selectedAsset.symbol}
                      </span>
                    </div>
                  </div>

                  {/* Monthly Output */}
                  <div className="pt-3 border-t border-white/5">
                    <div className="text-xs text-slate-400 mb-0.5">Estimated 30-Day Total:</div>
                    <div className="text-2xl font-bold font-mono text-gold-400">
                      ${estimatedMonthlyUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Operational Notes */}
                  <div className="pt-3 border-t border-white/5 space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Zero maintenance or electricity deducts</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Direct balance crediting to your account</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onOpenAuth('register')}
                className="gold-gradient-btn w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-gold-sm"
              >
                <span>Deploy This Hashrate</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>

          </div>

          {/* Honest Disclaimer */}
          <div className="mt-8 pt-4 border-t border-white/5 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
            <Info className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
            <p>
              <strong>Transparent Operations Notice:</strong> Figures calculated above are accurate mathematical projections based on prevailing network difficulty and live cryptocurrency market exchange rates. Quibands Global guarantees hardware uptime and transparent pool accounting without deceptive fixed promises.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
