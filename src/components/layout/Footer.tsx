import React from 'react';
import { Cpu, ShieldCheck, Activity, Globe, Mail, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onOpenContact: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenContact, onOpenAuth }) => {
  return (
    <footer className="bg-dark-950 border-t border-white/10 pt-16 pb-12 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-gold-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          
          {/* Col 1: Brand & Tagline */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 via-gold-600 to-amber-900 p-[1px] shadow-gold-sm">
                <div className="w-full h-full bg-dark-900 rounded-[10px] flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-gold-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-wider text-white font-['Outfit']">
                  QUIBANDS <span className="text-gold-400 font-light">GLOBAL</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 font-medium font-mono">
                  INSTITUTIONAL MINING INFRASTRUCTURE
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Quibands Global is a world-class enterprise cryptocurrency mining and treasury infrastructure protocol. Connecting institutional investors and global participants to high-efficiency ASIC hashpower, cold custody, and automated ledger settlements.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-dark-850 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>GRID: ALL CLUSTERS 100% OPERATIONAL</span>
              </div>
            </div>
          </div>

          {/* Col 2: Infrastructure */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-slate-200 uppercase tracking-wider font-semibold">
              Infrastructure
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-medium">
              <li><a href="#how-it-works" className="hover:text-gold-400 transition-colors">How It Works</a></li>
              <li><a href="#hashrate-engine" className="hover:text-gold-400 transition-colors">Hashrate Simulator</a></li>
              <li><a href="#supported-assets" className="hover:text-gold-400 transition-colors">Supported Crypto</a></li>
              <li><a href="#about" className="hover:text-gold-400 transition-colors">Green Data Centers</a></li>
              <li><a href="#overview" className="hover:text-gold-400 transition-colors">Immersion Rigs</a></li>
            </ul>
          </div>

          {/* Col 3: Treasury & Custody */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-slate-200 uppercase tracking-wider font-semibold">
              Treasury & Trust
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-medium">
              <li><a href="#treasury" className="hover:text-gold-400 transition-colors">Deposit Pipeline</a></li>
              <li><a href="#treasury" className="hover:text-gold-400 transition-colors">Instant Payouts</a></li>
              <li><a href="#security" className="hover:text-gold-400 transition-colors">Multi-Sig Cold Vault</a></li>
              <li><a href="#security" className="hover:text-gold-400 transition-colors">Double-Entry Ledger</a></li>
              <li><a href="#faq" className="hover:text-gold-400 transition-colors">Frequently Answered</a></li>
            </ul>
          </div>

          {/* Col 4: Platform Access & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-slate-200 uppercase tracking-wider font-semibold">
              Platform & Access
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-medium">
              <li>
                <button 
                  onClick={() => onOpenAuth('login')} 
                  className="hover:text-gold-400 transition-colors text-left flex items-center gap-1"
                >
                  <span>Client Login</span>
                  <ArrowUpRight className="w-3 h-3 text-gold-400" />
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onOpenAuth('register')} 
                  className="hover:text-gold-400 transition-colors text-left"
                >
                  Create Account
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenContact} 
                  className="hover:text-gold-400 transition-colors text-left"
                >
                  24/7 Priority Support
                </button>
              </li>
              <li>
                <span className="text-slate-500 font-mono text-[11px]">support@quibandsglobal.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Regulatory & Risk Disclosures */}
        <div className="pt-8 space-y-4 text-[11px] text-slate-500 leading-relaxed font-mono">
          <p>
            <strong>Risk Disclosure:</strong> Cryptocurrency mining and digital asset participation involve market and network difficulty fluctuations. Past performance does not guarantee future yields. Quibands Global provides legitimate cloud hashrate compute and transparent pool ledger accounting without deceptive guaranteed returns. Users are responsible for verifying local regulatory compliance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5 text-slate-400">
            <div>
              &copy; {new Date().getFullYear()} Quibands Global Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
              <span>&bull;</span>
              <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
              <span>&bull;</span>
              <span className="hover:text-white cursor-pointer transition-colors">AML & KYC Guidelines</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
