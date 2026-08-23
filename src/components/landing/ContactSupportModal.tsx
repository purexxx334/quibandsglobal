import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Headphones, 
  ShieldCheck, 
  CheckCircle2, 
  MessageSquare, 
  Clock, 
  Mail, 
  User
} from 'lucide-react';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'Mining & Hashrate Inquiries',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate real-time dispatch to support ticket queue
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 900);
  };

  const handleReset = () => {
    setIsSuccess(false);
    setFormData({
      name: '',
      email: '',
      topic: 'Mining & Hashrate Inquiries',
      message: ''
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md animate-fadeIn">
      
      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-dark-900 border border-white/10 p-6 sm:p-8 shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-white border border-white/5 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-emerald-glow">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white font-['Outfit']">Ticket Dispatched</h3>
            <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
              Thank you, <span className="text-gold-400 font-semibold">{formData.name}</span>. Your inquiry has been routed to our 24/7 specialized technical support engineers. We will respond to <span className="text-white font-mono">{formData.email}</span> within 15 minutes.
            </p>
            <div className="pt-4">
              <button
                onClick={handleReset}
                className="gold-gradient-btn px-8 py-3 rounded-xl text-sm font-semibold shadow-gold-sm"
              >
                Return to Platform
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-['Outfit']">Institutional Support Desk</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Engineers Online &bull; Avg Reply: &lt; 10 mins
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name / Entity Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alexander Vance"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-850 border border-white/10 text-white text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Verified Contact Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@institutional.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-dark-850 border border-white/10 text-white text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Subject Category
                </label>
                <select
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-850 border border-white/10 text-white text-sm focus:border-gold-500 focus:outline-none"
                >
                  <option value="Mining & Hashrate Inquiries">Mining & Hashrate Inquiries</option>
                  <option value="Deposit / Treasury Assistance">Deposit / Treasury Assistance</option>
                  <option value="Withdrawal Processing">Withdrawal Processing</option>
                  <option value="Institutional Dedicated Rig Array">Institutional Dedicated Rig Array</option>
                  <option value="Account & 2FA Security">Account & 2FA Security</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-1.5">
                  Message Details
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your inquiry or transaction details..."
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-850 border border-white/10 text-white text-sm focus:border-gold-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="gold-gradient-btn w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-gold-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Routing to Support Queue...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Transmit Priority Inquiry</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>TLS 1.3 256-Bit Encrypted Communication Channel</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
