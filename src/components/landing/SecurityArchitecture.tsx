import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  FileCheck, 
  Database, 
  Fingerprint, 
  EyeOff, 
  Server
} from 'lucide-react';

export const SecurityArchitecture: React.FC = () => {
  const securityPillars = [
    {
      icon: Lock,
      title: 'Multi-Signature Cold Storage',
      description: '98% of all platform cryptocurrency reserves are held in air-gapped, multi-signature cold vaults distributed across institutional custody tiers.'
    },
    {
      icon: Database,
      title: 'Immutable Ledger Accounting',
      description: 'Every deposit, mining block reward share, and withdrawal creates an immutable double-entry transaction record. Balance manipulation is mathematically prevented.'
    },
    {
      icon: KeyRound,
      title: '2-Factor Authentication (2FA)',
      description: 'Hardware security keys (FIDO2) and Time-based One-Time Passwords (TOTP) safeguard all sensitive account modifications and withdrawal authorizations.'
    },
    {
      icon: EyeOff,
      title: 'Zero-Knowledge Credential Defense',
      description: 'Passwords and authentication secrets are salted and hashed using Argon2id / bcrypt. No administrator or system engineer can ever view your plaintext keys.'
    },
    {
      icon: Fingerprint,
      title: 'Real-Time Fraud & Anomaly AI',
      description: 'Continuous heuristic monitoring detects unusual IP routing, duplicate transaction attempts, and unauthorized session hijacking in milliseconds.'
    },
    {
      icon: Server,
      title: 'Tier-4 Data Center Resiliency',
      description: 'Enterprise DDoS mitigation, redundant gigabit uplinks, and automated failover clustering ensure non-stop mining node continuity.'
    }
  ];

  return (
    <section id="security" className="py-24 relative bg-dark-950">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-4 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fortress Security Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-['Outfit'] tracking-tight mb-4">
            Security Designed for Sovereign Capital
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Quibands Global adheres to bank-grade financial standards. Our security architecture ensures that your computing capacity and cryptocurrency treasury remain impenetrable.
          </p>
        </div>

        {/* 6 Grid Security Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div 
                key={idx}
                className="p-7 rounded-2xl glass-card flex flex-col justify-between group hover:border-emerald-500/30"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-dark-850 border border-white/10 flex items-center justify-center mb-5 text-emerald-400 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-['Outfit'] mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>ENFORCED PROTOCOL</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
