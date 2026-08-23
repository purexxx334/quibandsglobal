import React from 'react';
import { Coins, CheckCircle, ArrowUpRight, Zap, Shield, Clock } from 'lucide-react';
import { mockCryptoMarket } from './LiveMarketTicker';

interface SupportedAssetsProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const SupportedAssets: React.FC<SupportedAssetsProps> = ({ onOpenAuth }) => {
  return (
    <section id="supported-assets" className="py-24 relative bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono mb-4 uppercase tracking-wider">
            <Coins className="w-3.5 h-3.5" />
            <span>Treasury & Liquidity</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-['Outfit'] tracking-tight mb-4">
            Supported Cryptocurrencies & Chains
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Deposit and mine with top-tier digital assets. Every currency is secured through institutional custody and fast automated blockchain confirmations.
          </p>
        </div>

        {/* Asset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockCryptoMarket.map((asset) => (
            <div 
              key={asset.id}
              className="p-6 rounded-2xl glass-card flex flex-col justify-between group"
            >
              <div>
                {/* Card Top */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-dark-950 text-sm shadow-md"
                      style={{ backgroundColor: asset.iconColor }}
                    >
                      {asset.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-1.5">
                        {asset.name}
                        <span className="text-xs font-mono text-slate-400 font-normal">({asset.symbol})</span>
                      </h3>
                      <div className="text-xs font-mono text-slate-400">
                        ${asset.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-dark-800 border border-white/10 text-gold-400">
                    {asset.algorithm}
                  </span>
                </div>

                {/* Specs Table */}
                <div className="space-y-2.5 py-3 border-y border-white/5 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Deposit Network:</span>
                    <span className="text-slate-200 font-medium">{asset.network}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Min. Deposit:</span>
                    <span className="text-emerald-400 font-semibold">{asset.minDeposit}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Confirmation Speed:</span>
                    <span className="text-slate-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gold-400" />
                      &lt; 3-6 Blocks
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Action */}
              <div className="pt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Cold Vault Protection
                </span>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="text-xs font-bold text-gold-400 group-hover:text-gold-300 flex items-center gap-1 transition-colors"
                >
                  <span>Deposit {asset.symbol}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
