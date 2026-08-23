import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { FAQItem } from '../../types';

interface FAQSectionProps {
  onOpenContact: () => void;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ onOpenContact }) => {
  const [openId, setOpenId] = useState<string>('faq-1');
  const [activeTab, setActiveTab] = useState<'all' | 'mining' | 'financial' | 'security'>('all');

  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      category: 'mining',
      question: 'How is cloud mining hashrate allocated to my account?',
      answer: 'Upon activating your desired hashrate capacity, our automated datacenter orchestrator assigns enterprise ASIC hardware (such as Antminer S21 Hydro units) from our Nordic and Icelandic facilities. Mining compute commences immediately with real-time telemetry streaming to your dashboard.'
    },
    {
      id: 'faq-2',
      category: 'mining',
      question: 'Do I need to maintain physical hardware or pay electricity bills?',
      answer: 'No. Quibands Global manages all hardware lifecycle operations, custom immersion cooling, power sub-stations, and firmwares. All operational expenses are already integrated into our wholesale renewable energy framework with zero unexpected surcharges.'
    },
    {
      id: 'faq-3',
      category: 'financial',
      question: 'How do cryptocurrency deposits and balance confirmations work?',
      answer: 'When you make a deposit, our multi-chain watcher monitors the specified blockchain. As soon as the standard block confirmations are fulfilled (e.g. 3 blocks for BTC, 12 for ETH/TRC-20), the ledger atomically credits your Available Balance.'
    },
    {
      id: 'faq-4',
      category: 'financial',
      question: 'How quickly are withdrawal payouts executed?',
      answer: 'Withdrawal requests undergo cryptographic balance integrity checks and multi-signature authorization. Approved payouts are dispatched directly to the mempool within minutes, allowing you to track the transaction on any public blockchain explorer.'
    },
    {
      id: 'faq-5',
      category: 'security',
      question: 'How are client funds and platform reserves secured?',
      answer: 'Over 98% of crypto reserves reside in multi-signature cold storage vaults requiring independent key-holder authorization. User credentials use military-grade hashing (Argon2/bcrypt), and all accounting is enforced by an immutable double-entry database architecture.'
    },
    {
      id: 'faq-6',
      category: 'security',
      question: 'Can administrators alter or manipulate ledger balances?',
      answer: 'No. Our architecture strictly forbids arbitrary database balance overwrites. Every credit, debit, or manual adjustment must produce an immutable audit log entry signed by an authorized administrator with mandatory justification.'
    }
  ];

  const filteredFaqs = activeTab === 'all' ? faqs : faqs.filter(f => f.category === activeTab);

  return (
    <section id="faq" className="py-24 relative bg-dark-900/60 border-t border-white/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono mb-4 uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Answered Inquiries</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-['Outfit'] tracking-tight mb-4">
            Everything You Need to Know
          </h2>
          <p className="text-base text-slate-400">
            Clear, unambiguous insights into our mining infrastructure, financial ledger, and platform security.
          </p>

          {/* Category Tabs */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'mining', label: 'Mining & Hashrate' },
              { id: 'financial', label: 'Deposits & Payouts' },
              { id: 'security', label: 'Vault & Security' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gold-500 text-dark-950 font-bold shadow-gold-sm'
                    : 'bg-dark-850 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div 
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? 'bg-dark-850 border-gold-500/40 shadow-lg' 
                    : 'bg-dark-850/60 border-white/5 hover:border-white/15'
                }`}
              >
                <button
                  onClick={() => setOpenId(isOpen ? '' : faq.id)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4"
                >
                  <span className="font-semibold text-white text-base font-['Outfit']">
                    {faq.question}
                  </span>
                  <div className={`p-1.5 rounded-lg bg-dark-800 text-gold-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-gold-300' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still have questions banner */}
        <div className="mt-12 p-6 rounded-2xl glass-card text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gold-400" />
              Have specific institutional questions?
            </h4>
            <p className="text-xs text-slate-400">Our senior engineering and support specialists are available 24/7.</p>
          </div>
          <button
            onClick={onOpenContact}
            className="px-5 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-gold-400 border border-gold-500/30 text-xs font-semibold whitespace-nowrap transition-all shadow-sm"
          >
            Contact Support Desk
          </button>
        </div>

      </div>
    </section>
  );
};
