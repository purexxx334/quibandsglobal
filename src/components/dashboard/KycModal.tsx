import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  Image as ImageIcon, 
  Globe, 
  MapPin, 
  User, 
  Calendar, 
  CreditCard,
  Clock,
  RotateCcw,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { KycSubmission, KycDocumentType } from '../../types';
import { API_BASE } from '../../config/api';

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKycUpdated?: () => void;
}


export const KycModal: React.FC<KycModalProps> = ({
  isOpen,
  onClose,
  onKycUpdated,
}) => {
  const { user, profile, session, refreshProfile } = useAuth();

  const [activeKyc, setActiveKyc] = useState<KycSubmission | null>(null);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Form Fields
  const [documentType, setDocumentType] = useState<KycDocumentType>('PASSPORT');
  const [documentNumber, setDocumentNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Image data URLs (Base64)
  const [idFrontUrl, setIdFrontUrl] = useState<string>('');
  const [idBackUrl, setIdBackUrl] = useState<string>('');
  const [selfieUrl, setSelfieUrl] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch active KYC submission on open
  const fetchMyKyc = async () => {
    if (!user) return;
    setLoadingKyc(true);
    try {
      const token = session?.access_token || (await supabase.auth.getSession()).data?.session?.access_token;
      const res = await fetch(`${API_BASE}/kyc/me`, {
        headers: { Authorization: `Bearer ${token || ''}` },
      });
      const text = await res.text();
      if (!text) return;
      const json = JSON.parse(text);
      if (json.success && json.data) {
        setActiveKyc(json.data);
      } else {
        setActiveKyc(null);
      }
    } catch (err: any) {
      console.warn('Error fetching KYC:', err.message);
    } finally {
      setLoadingKyc(false);
    }
  };

  const initializedRef = React.useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!initializedRef.current) {
        fetchMyKyc();
        setIsResubmitting(false);
        setErrorMsg(null);
        setSuccessMsg(null);

        // Pre-fill personal info if profile has them
        if (profile) {
          const nameParts = (profile.full_name || '').split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          setDob(profile.dob || '');
          setCountry(profile.country || '');
          setAddress(profile.address || '');
          setCity(profile.city || '');
          setPostalCode(profile.postal_code || '');
        }
        initializedRef.current = true;
      }
    } else {
      initializedRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // File to Compressed Base64 Image Reader (Max 1280px, WebP/JPEG, ~200kb)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('File size too large. Please upload an image under 20MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setter(compressedDataUrl);
          setErrorMsg(null);
        } else {
          setter(event.target?.result as string);
        }
      };
      img.onerror = () => {
        setter(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!documentNumber.trim() || !firstName.trim() || !lastName.trim() || !dob || !country.trim() || !address.trim()) {
      setErrorMsg('Please fill in all personal and document information fields.');
      return;
    }

    if (!idFrontUrl) {
      setErrorMsg('Please upload a clear picture/scan of your ID document front.');
      return;
    }

    if (!selfieUrl) {
      setErrorMsg('Please upload a selfie photo holding your ID document.');
      return;
    }

    setSubmitting(true);
    try {
      const token = session?.access_token || (await supabase.auth.getSession()).data?.session?.access_token;
      const res = await fetch(`${API_BASE}/kyc/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          documentType,
          documentNumber,
          firstName,
          lastName,
          dob,
          country,
          address,
          city,
          postalCode,
          idFrontUrl,
          idBackUrl,
          selfieUrl,
        }),
      });

      const text = await res.text();
      if (!text) {
        throw new Error('Server returned empty response. Please verify database connection.');
      }

      let json: any;
      try {
        json = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(`Server response error: ${text.slice(0, 100)}`);
      }

      if (!json.success) {
        throw new Error(json.error || 'Failed to submit KYC.');
      }

      setSuccessMsg('Your KYC credentials and documents have been submitted successfully! Compliance team will review your application.');
      setActiveKyc(json.data);
      setIsResubmitting(false);

      if (refreshProfile) await refreshProfile();
      if (onKycUpdated) onKycUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting KYC verification.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentStatus = activeKyc?.status || profile?.kyc_status || 'NOT_SUBMITTED';


  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-dark-950 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto sm:my-8 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-dark-950 to-slate-900">

          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">KYC Identity Verification</h2>
                {currentStatus === 'VERIFIED' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    VERIFIED
                  </span>
                )}
                {currentStatus === 'PENDING' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    UNDER REVIEW
                  </span>
                )}
                {currentStatus === 'REJECTED' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    REJECTED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Global AML/KYC institutional identity compliance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow custom-scrollbar">
          
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* VIEW: Already Verified */}
          {currentStatus === 'VERIFIED' && !isResubmitting && (
            <div className="p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Identity Fully Verified</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Your identity documents have been authenticated and approved by our compliance committee. Your account has unrestricted access to institutional vault limits.
                </p>
              </div>

              {activeKyc && (
                <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800 text-left grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">DOCUMENT TYPE</span>
                    <strong className="text-white">{activeKyc.document_type}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">DOCUMENT NO</span>
                    <strong className="text-emerald-400">••••{activeKyc.document_number.slice(-4)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">JURISDICTION</span>
                    <strong className="text-white">{activeKyc.country}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: Pending Review */}
          {currentStatus === 'PENDING' && !isResubmitting && (
            <div className="p-8 rounded-3xl bg-amber-950/20 border border-amber-500/30 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400 animate-pulse">
                <Clock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Verification Under Review</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Your KYC credentials and photos have been submitted. Our compliance team is currently reviewing your application. Average review time is 1 to 12 hours.
                </p>
              </div>

              {activeKyc && (
                <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800 text-left grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">APPLICANT NAME</span>
                    <strong className="text-white">{activeKyc.first_name} {activeKyc.last_name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">DOCUMENT TYPE</span>
                    <strong className="text-amber-400">{activeKyc.document_type}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">SUBMISSION DATE</span>
                    <strong className="text-white">{new Date(activeKyc.created_at).toLocaleDateString()}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: Rejected Notice with Resubmit Option */}
          {currentStatus === 'REJECTED' && !isResubmitting && (
            <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-500/30 space-y-4">
              <div className="flex items-start space-x-3.5">
                <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 flex-shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">KYC Verification Rejected</h3>
                  <p className="text-xs text-slate-400">
                    Your previous KYC submission was declined by the compliance auditor for the following reason:
                  </p>
                  <div className="mt-2 p-3 rounded-xl bg-dark-950 border border-rose-500/30 text-rose-300 text-xs font-mono">
                    "{activeKyc?.rejection_reason || 'Document images unclear or expired identity credential.'}"
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsResubmitting(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-lg transition-all flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Re-submit Correct Credentials</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW: KYC Submission Form (If NOT_SUBMITTED or Resubmitting) */}
          {(currentStatus === 'NOT_SUBMITTED' || isResubmitting) && (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Step 1: Legal Identity Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <CreditCard className="w-3.5 h-3.5 text-gold-400" />
                  <span>1. Identity Document Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Document Type</label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value as KycDocumentType)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none transition-colors"
                    >
                      <option value="PASSPORT">International Passport</option>
                      <option value="NATIONAL_ID">National Identity Card</option>
                      <option value="DRIVERS_LICENSE">Driver's License</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Document / ID Number</label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="e.g. A12345678"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">First / Given Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Alexander"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Last / Surname</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Hamilton"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none [color-scheme:dark]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Country of Citizenship / Issue</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. United Kingdom, Singapore"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Residential Street Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 100 Marina Boulevard, Suite #42"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Singapore"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Postal / Zip Code</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 018983"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dark-900 border border-slate-800 focus:border-gold-400 text-white text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Document Pictures & Selfie Uploads */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Camera className="w-3.5 h-3.5 text-gold-400" />
                  <span>2. Document Photos & Selfie Verification</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Photo 1: ID Front */}
                  <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">ID Document (Front)</span>
                      <span className="text-[10px] text-rose-400 font-bold">*Required</span>
                    </div>

                    {idFrontUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 group aspect-[4/3] bg-black">
                        <img src={idFrontUrl} alt="ID Front" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setIdFrontUrl('')}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white opacity-90 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-700 hover:border-gold-400/60 rounded-xl aspect-[4/3] flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors bg-dark-950/60">
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[11px] font-medium text-slate-300">Upload Front Side</span>
                        <span className="text-[9px] text-slate-500">JPG, PNG up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, setIdFrontUrl)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Photo 2: ID Back */}
                  <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">ID Document (Back)</span>
                      <span className="text-[10px] text-slate-500">Optional for Passport</span>
                    </div>

                    {idBackUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 group aspect-[4/3] bg-black">
                        <img src={idBackUrl} alt="ID Back" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setIdBackUrl('')}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white opacity-90 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-700 hover:border-gold-400/60 rounded-xl aspect-[4/3] flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors bg-dark-950/60">
                        <Upload className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-[11px] font-medium text-slate-300">Upload Back Side</span>
                        <span className="text-[9px] text-slate-500">JPG, PNG up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, setIdBackUrl)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Photo 3: Selfie holding ID */}
                  <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Selfie with ID</span>
                      <span className="text-[10px] text-rose-400 font-bold">*Required</span>
                    </div>

                    {selfieUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 group aspect-[4/3] bg-black">
                        <img src={selfieUrl} alt="Selfie with ID" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setSelfieUrl('')}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white opacity-90 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-700 hover:border-gold-400/60 rounded-xl aspect-[4/3] flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors bg-dark-950/60">
                        <Camera className="w-6 h-6 text-emerald-400 mb-1" />
                        <span className="text-[11px] font-medium text-slate-300">Upload Selfie</span>
                        <span className="text-[9px] text-slate-500">Hold ID next to face</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, setSelfieUrl)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                {isResubmitting && (
                  <button
                    type="button"
                    onClick={() => setIsResubmitting(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg transition-all flex items-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'Submitting Credentials...' : 'Submit KYC for Verification'}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
