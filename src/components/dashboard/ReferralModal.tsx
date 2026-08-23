import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Copy, 
  Check, 
  Share2, 
  DollarSign, 
  TrendingUp, 
  Gift, 
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { API_BASE } from '../../config/api';



interface ReferralUser {
  id: string;
  email: string;
  username: string;
  joinedAt: string;
  status: string;
  commissionEarned: number;
}

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [commissionRate, setCommissionRate] = useState(10);
  const [referredUsers, setReferredUsers] = useState<ReferralUser[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {

    if (isOpen) {
      fetchReferralData();
    }
  }, [isOpen]);

  const fetchReferralData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: auth } = await supabase.auth.getSession();
      const token = auth.session?.access_token;
      if (!token) return;

      const res = await fetch(`${API_BASE}/referrals/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const json = await res.json();
      if (json.success && json.data) {
        setReferralCode(json.data.referralCode);
        setReferralLink(json.data.referralLink);
        setTotalReferrals(json.data.totalReferrals || 0);
        setTotalEarnings(json.data.totalEarnings || 0);
        setCommissionRate(json.data.commissionRatePercent || 10);
        setReferredUsers(json.data.referredUsers || []);
      } else {
        setErrorMsg(json.error || 'Failed to retrieve referral data.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error fetching referral statistics.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2.5 sm:p-4 bg-dark-950/85 backdrop-blur-md overflow-y-auto overscroll-contain animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-dark-900 border border-slate-800 shadow-2xl overflow-hidden my-auto sm:my-8 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-dark-950/60">

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center text-gold-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                <span>Affiliate & Referral Rewards</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-400/10 text-gold-300 border border-gold-400/30">
                  {commissionRate}% Commission
                </span>
              </h3>
              <p className="text-xs text-slate-400">Share your link to earn passive hash dividends from friends and institutional nodes.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-2xl bg-dark-950/70 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Total Referred</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {totalReferrals} <span className="text-xs font-normal text-slate-500">Users</span>
              </div>
              <div className="text-[10px] text-cyan-400 font-mono">Active Trading Affiliates</div>
            </div>

            <div className="p-4 rounded-2xl bg-dark-950/70 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Total Earnings</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                ${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-emerald-500 font-mono">Auto-credited to Portfolio</div>
            </div>

            <div className="p-4 rounded-2xl bg-dark-950/70 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Commission Rate</span>
                <TrendingUp className="w-4 h-4 text-gold-400" />
              </div>
              <div className="text-2xl font-black text-gold-400 font-mono">
                {commissionRate}%
              </div>
              <div className="text-[10px] text-gold-500 font-mono">Lifetime Node Payouts</div>
            </div>

          </div>

          {/* Referral Link & Code Share Boxes */}
          <div className="space-y-4 p-5 rounded-2xl bg-dark-950/90 border border-gold-400/20">
            
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono mb-1.5">
                Your Unique Referral Invite Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={loading ? 'Generating invite link...' : referralLink}
                  className="flex-1 p-3 bg-dark-900 border border-slate-800 rounded-xl text-xs text-gold-300 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-3 bg-gold-400 hover:bg-gold-500 text-dark-950 font-bold rounded-xl text-xs font-mono flex items-center gap-1.5 transition shadow-gold-sm flex-shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono mb-1.5">
                Your Referral Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={loading ? '...' : referralCode}
                  className="w-48 p-3 bg-dark-900 border border-slate-800 rounded-xl text-sm font-bold text-white font-mono text-center select-all focus:outline-none"
                />
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-3 bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs font-mono flex items-center gap-1.5 transition border border-slate-700"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Referred Users Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Referred Affiliates ({referredUsers.length})</span>
            </h4>

            {referredUsers.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl space-y-2">
                <Share2 className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs font-medium text-slate-400">No referred traders yet.</p>
                <p className="text-[11px] text-slate-500 font-mono">Send your invite link to friends, colleagues, and investment groups to start earning.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-dark-950/60">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-slate-800 text-slate-400 bg-dark-950/80">
                    <tr>
                      <th className="py-2.5 px-4">User</th>
                      <th className="py-2.5 px-4">Joined Date</th>
                      <th className="py-2.5 px-4">Commission</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {referredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/20">
                        <td className="py-2.5 px-4 font-sans font-medium text-white">{u.email}</td>
                        <td className="py-2.5 px-4 text-slate-400">{new Date(u.joinedAt).toLocaleDateString()}</td>
                        <td className="py-2.5 px-4 text-emerald-400 font-bold">+${u.commissionEarned.toFixed(2)}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            {u.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-dark-950/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Instant Commission Settlement to Main Wallet</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition"
          >
            Close Hub
          </button>
        </div>

      </div>
    </div>
  );
};
