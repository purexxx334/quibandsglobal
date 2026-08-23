import React from 'react';
import { 
  Building2, 
  Leaf, 
  Cpu, 
  ShieldAlert, 
  CheckCircle, 
  Globe, 
  Award, 
  Zap, 
  ServerCrash,
  Server
} from 'lucide-react';

export const AboutPlatform: React.FC = () => {
  const facilityHighlights = [
    {
      icon: Server,
      title: 'Next-Gen Mining Hardware',
      description: 'Equipped with the latest Bitmain Antminer S21 Pro Hydro and WhatsMiner M63S immersion-cooled series for peak efficiency.'
    },
    {
      icon: Leaf,
      title: '100% Sustainable Green Power',
      description: 'Zero-emission data centers powered strictly by Scandinavian hydropower and Icelandic geothermal energy resources.'
    },
    {
      icon: Building2,
      title: 'Institutional Infrastructure',
      description: 'Redundant fiber backbone, on-site certified technicians, and automated thermal throttling algorithms ensure 99.98% uptime.'
    },
    {
      icon: Award,
      title: 'Cryptographic Transparency',
      description: 'Every mining block share and reward settlement is recorded in an immutable ledger with zero hidden maintenance deductions.'
    }
  ];

  return (
    <section id="about" className="py-24 relative overflow-hidden bg-dark-950">
      
      {/* Background ambient subtle glow */}
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="absolute top-1/3 left-10 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10 animate-float-delayed" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid: Info on left, Visual Facility Spec on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Story & Principles */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 animate-spin-very-slow" />
              <span>About Quibands Global</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-['Outfit'] tracking-tight leading-tight">
              Pioneering Institutional Cloud Mining with Absolute Integrity.
            </h2>

            <p className="text-base text-slate-300 leading-relaxed">
              Founded to democratize institutional-grade cryptocurrency mining, Quibands Global operates state-of-the-art data centers in prime thermodynamic regions. We bridge the gap between heavy industrial computing and retail accessibility without deceptive profit guarantees or artificial roadblocks.
            </p>

            <p className="text-sm text-slate-400 leading-relaxed">
              By combining immersion cooling technology, direct wholesale energy contracts, and an enterprise double-entry ledger system, our platform delivers maximum hashrate yield with rigorous cold-storage fund protection.
            </p>

            {/* Live Metrics Cards with subtle float */}
            <div className="pt-4 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-dark-850/90 border border-white/10 hover:border-gold-500/30 transition-all hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl font-bold text-white font-mono">14.8 J/TH</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div className="text-xs text-slate-400">Average Energy Efficiency</div>
              </div>

              <div className="p-4 rounded-xl bg-dark-850/90 border border-white/10 hover:border-gold-500/30 transition-all hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl font-bold text-gold-400 font-mono">3 Global Sites</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">100% RE</span>
                </div>
                <div className="text-xs text-slate-400">Iceland, Norway & USA</div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Pillars Cards with Lively Hover & Float */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {facilityHighlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx}
                  className={`p-6 rounded-2xl glass-card flex flex-col justify-between group transition-all duration-300 ${
                    idx % 2 === 0 ? 'hover:-translate-y-2' : 'hover:-translate-y-2'
                  }`}
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-dark-800 border border-gold-500/20 flex items-center justify-center mb-4 text-gold-400 shadow-sm group-hover:scale-110 group-hover:border-gold-500/50 transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white font-['Outfit'] mb-2 group-hover:text-gold-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Verified Operational</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
