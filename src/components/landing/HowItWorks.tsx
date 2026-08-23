import React from 'react';
import { 
  Wallet, 
  Cpu, 
  ArrowRight, 
  Coins, 
  CheckCircle2, 
  Shield, 
  Zap, 
  RefreshCw, 
  DownloadCloud
} from 'lucide-react';

interface HowItWorksProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenAuth }) => {
  const steps = [
    {
      step: '01',
      icon: Wallet,
      title: 'Deposit Cryptocurrency',
      subtitle: 'Instant Multi-Chain Funding',
      description: 'Deposit funds into your dedicated Quibands treasury address using Bitcoin, Ethereum, USDT, Solana, or Litecoin. Every transaction is tracked on-chain and credited to your verified available balance.',
      features: [
        'Multi-network support (TRC-20, ERC-20, Native BTC)',
        'Zero deposit fees with fast ledger confirmations',
        'Cold-storage multi-sig protected vault'
      ],
      badgeColor: 'from-amber-500 to-amber-700',
      iconColor: 'text-amber-400'
    },
    {
      step: '02',
      icon: Cpu,
      title: 'Deploy Hashrate & Mine',
      subtitle: 'Automated ASIC Cloud Compute',
      description: 'Allocate your balance towards high-efficiency institutional mining clusters. Quibands manages cooling, hardware maintenance, pool routing, and uptime, ensuring optimal mining efficiency 24/7.',
      features: [
        'Instant hashrate allocation with zero latency',
        'State-of-the-art Bitmain & WhatsMiner rigs',
        '100% renewable hydro & geothermal powered'
      ],
      badgeColor: 'from-gold-400 to-amber-600',
      iconColor: 'text-gold-400'
    },
    {
      step: '03',
      icon: Coins,
      title: 'Earn & Withdraw Yield',
      subtitle: 'Transparent Daily Realization',
      description: 'Mined crypto rewards accumulate directly into your ledger. Monitor real-time daily payouts transparently, re-invest in additional computing power, or withdraw seamlessly to your external personal wallet.',
      features: [
        'Automated daily mining reward settlements',
        'Immutable double-entry balance accounting',
        'Swift, hassle-free withdrawal execution'
      ],
      badgeColor: 'from-emerald-400 to-emerald-600',
      iconColor: 'text-emerald-400'
    }
  ];

  return (
    <section id="how-it-works" className="py-24 relative bg-dark-900/60 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono mb-4 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>Seamless Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-['Outfit'] tracking-tight mb-4">
            How Quibands Global Works
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Eliminating the complexity of noisy hardware rigs, high electricity bills, and technical downtime. Start earning cloud mining rewards in three straightforward steps.
          </p>
        </div>

        {/* 3 Step Interactive Process Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Connector Line on Desktop */}
          <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-[2px] bg-gradient-to-r from-amber-500/20 via-gold-500/40 to-emerald-500/20 -translate-y-12 z-0 pointer-events-none" />

          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.step}
                className="relative z-10 p-8 rounded-2xl glass-card flex flex-col justify-between group hover:border-gold-500/40"
              >
                <div>
                  {/* Step Header with Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-dark-850 border border-white/10 flex items-center justify-center p-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-7 h-7 ${item.iconColor}`} />
                    </div>
                    <span className="text-4xl font-extrabold font-mono text-white/10 group-hover:text-gold-500/20 transition-colors">
                      {item.step}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-gold-400 uppercase tracking-wider font-semibold">
                    {item.subtitle}
                  </span>
                  <h3 className="text-xl font-bold text-white font-['Outfit'] mt-1 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="pt-4 border-t border-white/5 space-y-2.5">
                  {item.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>

        {/* CTA banner below How it Works */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-dark-850 via-dark-800 to-dark-850 border border-gold-500/20 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-xl font-bold text-white font-['Outfit']">Ready to begin your cloud mining session?</h4>
            <p className="text-sm text-slate-400">Join thousands of institutional and retail participants generating daily proof-of-work yields.</p>
          </div>
          <button
            onClick={() => onOpenAuth('register')}
            className="gold-gradient-btn px-7 py-3 rounded-xl text-sm font-semibold whitespace-nowrap flex items-center gap-2 shadow-gold-sm"
          >
            <span>Create Your Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
