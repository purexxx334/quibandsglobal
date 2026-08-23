import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Camera, 
  Save, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { API_BASE } from '../../config/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
}


export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const { user, profile, session, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [dob, setDob] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setPhoneNumber(profile.phone_number || '');
      setCountry(profile.country || '');
      setAddress(profile.address || '');
      setCity(profile.city || '');
      setPostalCode(profile.postal_code || '');
      setDob(profile.dob || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const token = session?.access_token || (await supabase.auth.getSession()).data?.session?.access_token;
      const res = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          username,
          phone_number: phoneNumber,
          country,
          address,
          city,
          postal_code: postalCode,
          dob,
          avatar_url: avatarUrl,
        }),
      });

      const text = await res.text();
      if (!text) {
        throw new Error('Server returned empty response.');
      }

      let json: any;
      try {
        json = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(`Server response error: ${text.slice(0, 100)}`);
      }

      if (!json.success) {
        throw new Error(json.error || 'Failed to update profile.');
      }


      setStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
      if (refreshProfile) await refreshProfile();
      if (onProfileUpdated) onProfileUpdated();

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-dark-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-dark-950 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Edit Investor Profile</h2>
              <p className="text-xs text-slate-400">Update your personal and residential details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-grow custom-scrollbar">
          
          {statusMsg && (
            <div className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300' 
                : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Account Read-only Info */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gold-400/20 border border-gold-400/40 flex items-center justify-center text-gold-300 font-bold text-sm">
                {(fullName || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{user?.email}</div>
                <div className="text-[11px] text-slate-400 font-mono">UID: {user?.id?.slice(0, 12)}...</div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30">
              Tier: {profile?.account_tier || 'BASIC'}
            </span>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gold-400" />
              <span>Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Legal Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alexander Hamilton"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Username / Alias</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. alex_investor"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Date of Birth</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Residential Address Information */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gold-400" />
              <span>Residential Address</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Country / Jurisdiction</label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. United Kingdom, Singapore, United States"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 100 Marina Boulevard, Suite #42"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. London"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Postal / Zip Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. EC2A 4NE"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-400 to-amber-600 hover:from-gold-500 hover:to-amber-700 text-dark-950 font-bold text-xs shadow-gold transition-all flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
