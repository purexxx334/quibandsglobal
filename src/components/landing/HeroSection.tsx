import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Zap, 
  ArrowRight, 
  Server, 
  Lock, 
  CheckCircle2, 
  TrendingUp, 
  Layers, 
  Globe2, 
  BarChart3,
  Activity,
  Droplets,
  Sparkles
} from 'lucide-react';
import { GlobalWorldGridBackground } from './GlobalWorldGridBackground';

interface HeroSectionProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenCalculator: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAuth, onOpenCalculator }) => {
  const [liveBlocks, setLiveBlocks] = useState(882419);
  const [liveHashrate, setLiveHashrate] = useState(482.6);
  const [realtimeMinedUsd, setRealtimeMinedUsd] = useState(4920.45);

  // Micro-simulation of live hashrate metrics
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveHashrate(prev => +(prev + (Math.random() * 0.4 - 0.2)).toFixed(2));
      setRealtimeMinedUsd(prev => +(prev + 0.08).toFixed(2));
    }, 2500);

    const blockTimer = setInterval(() => {
      setLiveBlocks(b => b + 1);
    }, 18000);

    return () => {
      clearInterval(timer);
      clearInterval(blockTimer);
    };
  }, []);

  return (
    <section id="overview" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden min-h-[90vh] flex flex-col justify-center">
      
      {/* 1. Global World Grid & Interactive Earth Node Background */}
      <GlobalWorldGridBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Announcement Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-dark-850/90 border border-gold-500/30 text-slate-200 text-xs font-medium backdrop-blur-md shadow-gold-sm hover:border-gold-500/50 transition-all cursor-pointer">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
            </span>
            <span className="text-gold-400 font-semibold uppercase tracking-wider font-mono">QUIBANDS NEXT-GEN</span>
            <span className="text-slate-400">|</span>
            <span>Enterprise-Grade ASIC & Cloud Mining Infrastructure</span>
            <ArrowRight className="w-3.5 h-3.5 text-gold-400 ml-0.5" />
          </div>
        </div>

        {/* Main Hero Header */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-['Outfit'] leading-[1.1] mb-6">
            Institutional <span className="gold-gradient-text">Cryptocurrency Mining</span> Built for Precision & Scale.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 font-normal leading-relaxed max-w-3xl mx-auto">
            Quibands Global bridges institutional-grade ASIC computing power with a transparent, double-entry financial treasury. Deposit cryptocurrency, activate high-efficiency cloud hashrate, and stream verified mining yields directly to your portfolio.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('register')}
              className="gold-gradient-btn w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold shadow-gold-md flex items-center justify-center gap-3 transition-transform active:scale-95"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>Start Cloud Mining</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenCalculator}
              className="w-full sm:w-auto px-7 py-4 rounded-xl text-base font-semibold bg-dark-850/80 hover:bg-dark-800 text-slate-200 hover:text-white border border-white/15 hover:border-gold-500/40 backdrop-blur-md transition-all flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-5 h-5 text-gold-400" />
              <span>Calculate Hashrate Yield</span>
            </button>
          </div>

          {/* Trust points */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Non-Custodial Transparency</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-gold-400" />
              <span>Multi-Signature Cold Storage</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero Hardware Maintenance</span>
            </div>
          </div>
        </div>

        {/* Live Terminal & Interactive Node Grid Mockup */}
        <div className="relative max-w-5xl mx-auto">
          
          {/* Floating Pill 1 (Top Left): Live Efficiency & Zero Carbon */}
          <div className="hidden lg:flex items-center gap-3 absolute -top-8 -left-8 z-30 p-3 rounded-2xl bg-dark-900/95 border border-gold-500/30 backdrop-blur-xl shadow-2xl animate-float-slow">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <Droplets className="w-5 h-5 animate-bounce" />
            </div>
            <div className="text-left font-mono">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                IMMERSION HYDRO COOLING
              </div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="text-gold-400">14.8 J/TH</span>
                <span className="text-slate-400 font-normal">|</span>
                <span className="text-emerald-400 text-[11px]">100% RE Power</span>
              </div>
            </div>
          </div>

          {/* Floating Pill 2 (Top Right): Hashrate Settlement Stream */}
          <div className="hidden lg:flex items-center gap-3 absolute -top-8 -right-8 z-30 p-3 rounded-2xl bg-dark-900/95 border border-emerald-500/40 backdrop-blur-xl shadow-2xl animate-float-delayed">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div className="text-left font-mono">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-gold-400" />
                LIVE BLOCK REWARDS
              </div>
              <div className="text-xs font-bold text-emerald-400">
                DAILY POOL AUTO-PAYOUT
              </div>
            </div>
          </div>

          {/* Floating Pill 3 (Bottom Left): Non-Custodial Multi-Sig Security */}
          <div className="hidden lg:flex items-center gap-3 absolute -bottom-6 -left-6 z-30 p-3 rounded-2xl bg-dark-900/95 border border-white/10 backdrop-blur-xl shadow-2xl animate-float-reverse">
            <div className="w-10 h-10 rounded-xl bg-dark-800 border border-white/10 flex items-center justify-center text-gold-400">
              <Lock className="w-5 h-5" />
            </div>
            <div className="text-left font-mono">
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">COLD VAULT CUSTODY</div>
              <div className="text-xs font-bold text-white">98.4% Air-Gapped Reserves</div>
            </div>
          </div>

          {/* Outer glow frame */}
          <div className="p-1 rounded-2xl bg-gradient-to-b from-gold-500/30 via-white/10 to-transparent shadow-2xl relative z-10">
            <div className="bg-dark-900/95 rounded-[15px] border border-white/10 overflow-hidden backdrop-blur-xl">
              
              {/* Terminal Titlebar */}
              <div className="px-5 py-3.5 bg-dark-950/90 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="h-4 w-[1px] bg-white/10 ml-1" />
                  <span className="text-xs font-mono text-slate-300 font-medium flex items-center gap-2">
                    <Server className="w-3.5 h-3.5 text-gold-400" />
                    QUIBANDS-CLUSTER // NODE-01_ICELAND_HYDRO
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
                    <Globe2 className="w-3.5 h-3.5 text-slate-500" />
                    DC: Reykjanes Geo-Facility
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    SYNCED BLOCK #{liveBlocks}
                  </span>
                </div>
              </div>

              {/* Terminal Dashboard Content */}
              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Metrics Columns */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Big Metric Display */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-xl bg-dark-850/80 border border-white/5">
                      <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-gold-400" /> Total Hashrate
                      </div>
                      <div className="text-2xl font-bold font-mono text-white tracking-tight">
                        {liveHashrate} <span className="text-xs font-normal text-gold-400">EH/s</span>
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-1 flex items-center gap-0.5">
                        <TrendingUp className="w-3 h-3" /> +4.2% Grid expansion
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-dark-850/80 border border-white/5">
                      <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-blue-400" /> Active Rigs
                      </div>
                      <div className="text-2xl font-bold font-mono text-white tracking-tight">
                        24,810 <span className="text-xs font-normal text-slate-400">ASIC</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        Antminer S21 Pro / Hydro
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-dark-850/80 border border-white/5 col-span-2 sm:col-span-1">
                      <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" /> Power Eff.
                      </div>
                      <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
                        15.5 <span className="text-xs font-normal text-slate-400">J/TH</span>
                      </div>
                      <div className="text-[10px] text-emerald-400/90 font-mono mt-1">
                        100% Zero-Carbon Hydro
                      </div>
                    </div>
                  </div>

                  {/* Hashrate Live Streaming Graph Mockup */}
                  <div className="p-4 rounded-xl bg-dark-850/50 border border-white/5">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-3">
                      <span className="font-semibold text-slate-200">24-HOUR HASHRATE CONTINUITY & SETTLEMENT</span>
                      <span className="text-gold-400">DIFF: 86.4T</span>
                    </div>

                    {/* Visual Bar Spectrum */}
                    <div className="h-20 w-full flex items-end gap-1 sm:gap-1.5 pt-2">
                      {[65, 72, 68, 85, 90, 82, 88, 95, 92, 98, 94, 99, 96, 92, 89, 94, 98, 100, 97, 95, 99, 96, 98, 100].map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group cursor-pointer">
                          <div 
                            className={`w-full rounded-t-sm transition-all duration-300 ${
                              idx >= 18 
                                ? 'bg-gradient-to-t from-gold-600 to-gold-400 shadow-gold-sm' 
                                : 'bg-slate-700 hover:bg-slate-500'
                            }`}
                            style={{ height: `${val}%` }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2">
                      <span>00:00 UTC</span>
                      <span>06:00 UTC</span>
                      <span>12:00 UTC</span>
                      <span>18:00 UTC</span>
                      <span className="text-gold-400">LIVE</span>
                    </div>
                  </div>

                </div>

                {/* Right Side: Live Ledger Payout Stream & Quick Action */}
                <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-xl bg-gradient-to-b from-dark-800/90 to-dark-850/90 border border-white/10">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                      <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                        <span>RECENT LEDGER SETTLEMENTS</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">AUDITED</span>
                    </div>

                    {/* Ledger entries mock stream */}
                    <div className="space-y-2.5 font-mono text-xs">
                      <div className="p-2.5 rounded-lg bg-dark-900/80 border border-white/5 flex items-center justify-between">
                        <div>
                          <div className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">+0.00482 BTC</span>
                            <span className="text-[10px] text-slate-500">(SHA-256)</span>
                          </div>
                          <div className="text-[10px] text-slate-400">TX #98421b &bull; 12s ago</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">CREDITED</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-dark-900/80 border border-white/5 flex items-center justify-between">
                        <div>
                          <div className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">+184.20 USDT</span>
                            <span className="text-[10px] text-slate-500">(TRC-20)</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Deposit Approved &bull; 1m ago</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">SETTLED</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-dark-900/80 border border-white/5 flex items-center justify-between">
                        <div>
                          <div className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">+0.142 ETH</span>
                            <span className="text-[10px] text-slate-500">(PoS Valid.)</span>
                          </div>
                          <div className="text-[10px] text-slate-400">Daily Payout &bull; 3m ago</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px]">CREDITED</span>
                      </div>
                    </div>
                  </div>

                  {/* Terminal Footer CTA */}
                  <div className="pt-5 mt-4 border-t border-white/10 flex items-center justify-between gap-3">
                    <div className="text-left">
                      <div className="text-[11px] text-slate-400">Realized Mining Pool Yield:</div>
                      <div className="text-sm font-bold font-mono text-gold-400">${realtimeMinedUsd.toLocaleString()} / hr</div>
                    </div>
                    <button
                      onClick={() => onOpenAuth('register')}
                      className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-dark-950 font-bold text-xs transition-colors"
                    >
                      Deploy Hashrate
                    </button>
                  </div>

                </div>

              </div>

            </div>
          </div>
        </div>

        {/* Global Key Stats Strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="p-5 rounded-xl glass-card text-center">
            <div className="text-3xl font-extrabold text-white font-['Outfit'] mb-1">$148.5M+</div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Hashrate Value Deployed</div>
          </div>

          <div className="p-5 rounded-xl glass-card text-center">
            <div className="text-3xl font-extrabold text-gold-400 font-['Outfit'] mb-1">99.98%</div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Facility Hardware Uptime</div>
          </div>

          <div className="p-5 rounded-xl glass-card text-center">
            <div className="text-3xl font-extrabold text-white font-['Outfit'] mb-1">32,400+</div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Global Registered Miners</div>
          </div>

          <div className="p-5 rounded-xl glass-card text-center">
            <div className="text-3xl font-extrabold text-emerald-400 font-['Outfit'] mb-1">&lt; 15 mins</div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Treasury Withdrawal Processing</div>
          </div>
        </div>

      </div>
    </section>
  );
};
