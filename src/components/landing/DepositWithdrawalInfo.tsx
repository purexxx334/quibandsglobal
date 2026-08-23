import React from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  Lock, 
  Banknote, 
  History,
  FileSpreadsheet
} from 'lucide-react';

interface DepositWithdrawalInfoProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const DepositWithdrawalInfo: React.FC<DepositWithdrawalInfoProps> = ({ onOpenAuth }) => {
  return (
    <section id="treasury" className="py-24 relative bg-dark-900/60 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono mb-4 uppercase tracking-wider">
            <Banknote className="w-3.5 h-3.5" />
            <span>Treasury & Settlement</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-['Outfit'] tracking-tight mb-4">
            Transparent Deposits & Instant Payouts
          </h2>
          <p className="text-base text-slate-400 leading-relaxed">
            Every satoshi and wei in Quibands Global is accounted for with an immutable double-entry ledger. Clear segregation of your principal, active hashrate, and realized mining yield.
          </p>
        </div>

        {/* Dual Panels: Deposit Workflow vs Withdrawal Workflow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Deposit Flow Box */}
          <div className="p-8 rounded-3xl glass-panel relative overflow-hidden border border-white/10 hover:border-gold-500/30 transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-gold-400">
                  <ArrowDownLeft className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-['Outfit']">Deposit Pipeline</h3>
                  <p className="text-xs text-slate-400">Cryptocurrency Funding & Allocation</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/10 text-gold-400">
                0% FEES
              </span>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-dark-850 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-dark-800 text-gold-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  1
                </div>
                <div>
                  <div className="font-semibold text-white text-xs mb-0.5">Generate Dedicated Vault Address</div>
                  <div className="text-xs text-slate-400">Select your cryptocurrency and desired network (TRC-20, ERC-20, Bitcoin native). Receive a unique, encrypted deposit address.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-dark-850 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-dark-800 text-gold-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  2
                </div>
                <div>
                  <div className="font-semibold text-white text-xs mb-0.5">Blockchain Network Verification</div>
                  <div className="text-xs text-slate-400">Submit your transaction hash. Nodes automatically track block confirmations on public explorers.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-dark-850 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-dark-800 text-gold-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  3
                </div>
                <div>
                  <div className="font-semibold text-white text-xs mb-0.5">Atomic Ledger Crediting</div>
                  <div className="text-xs text-slate-400">Upon confirmation, funds are instantly credited to your Available Balance and ready for hashrate activation.</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Multi-Sig Cold Stored
              </span>
              <button
                onClick={() => onOpenAuth('login')}
                className="text-gold-400 font-semibold hover:underline"
              >
                Deposit Funds &rarr;
              </button>
            </div>
          </div>

          {/* Withdrawal Flow Box */}
          <div className="p-8 rounded-3xl glass-panel relative overflow-hidden border border-white/10 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-['Outfit']">Withdrawal Protocol</h3>
                  <p className="text-xs text-slate-400">Direct Personal Wallet Payouts</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400">
                FAST EXECUTION
              </span>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-dark-850 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-dark-800 text-emerald-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  1
                </div>
                <div>
                  <div className="font-semibold text-white text-xs mb-0.5">Specify Recipient Destination</div>
                  <div className="text-xs text-slate-400">Enter your external hardware or exchange wallet address and specify the desired payout amount.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-dark-850 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-dark-800 text-emerald-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  2
                </div>
                <div>
                  <div className="font-semibold text-white text-xs mb-0.5">2FA & Security Verification</div>
                  <div className="text-xs text-slate-400">Authenticate through Two-Factor Authentication (2FA) and cryptographic checksum verification.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-dark-850 border border-white/5">
                <div className="w-6 h-6 rounded-full bg-dark-800 text-emerald-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  3
                </div>
                <div>
                  <div className="font-semibold text-white text-xs mb-0.5">Blockchain Broadcast</div>
                  <div className="text-xs text-slate-400">Immutable ledger debit is applied, and the payout transaction is immediately broadcast to the blockchain mempool.</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono">
                <FileSpreadsheet className="w-4 h-4 text-gold-400" />
                Real-Time Audited
              </span>
              <button
                onClick={() => onOpenAuth('login')}
                className="text-emerald-400 font-semibold hover:underline"
              >
                Withdraw Yield &rarr;
              </button>
            </div>
          </div>

        </div>

        {/* Balance Segregation Explanation */}
        <div className="mt-12 p-6 rounded-2xl bg-dark-850/80 border border-white/5 max-w-5xl mx-auto">
          <div className="text-xs font-mono text-gold-400 uppercase tracking-wider font-semibold mb-3 flex items-center gap-2">
            <History className="w-4 h-4" />
            <span>Strict Balance Categorization (Zero Ambiguity)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-dark-900 border border-white/5">
              <div className="text-slate-400 mb-1">Available Balance:</div>
              <div className="text-white font-semibold">Ready for instant withdrawal or new hashrate activation</div>
            </div>
            <div className="p-3 rounded-lg bg-dark-900 border border-white/5">
              <div className="text-slate-400 mb-1">Deposited Principal:</div>
              <div className="text-white font-semibold">Active funds deployed into running mining session nodes</div>
            </div>
            <div className="p-3 rounded-lg bg-dark-900 border border-white/5">
              <div className="text-slate-400 mb-1">Pending Mining Rewards:</div>
              <div className="text-white font-semibold">Accumulating block shares undergoing 24h pool validation</div>
            </div>
            <div className="p-3 rounded-lg bg-dark-900 border border-white/5">
              <div className="text-slate-400 mb-1">Realized Rewards:</div>
              <div className="text-emerald-400 font-semibold">Finalized mining profits credited into ledger history</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
