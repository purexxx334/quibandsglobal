import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Menu, 
  X, 
  ChevronRight, 
  Headphones, 
  LogIn, 
  UserPlus, 
  Activity,
  ArrowUpRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LanguageSelector } from '../common/LanguageSelector';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenContact: () => void;
  onOpenAdmin?: () => void;
  onOpenDeposit?: () => void;
  onOpenWithdrawal?: () => void;
  currentView?: 'dashboard' | 'landing';
  onNavigateView?: (view: 'dashboard' | 'landing') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenAuth, 
  onOpenContact, 
  onOpenAdmin, 
  onOpenDeposit,
  onOpenWithdrawal,
  currentView = 'landing',
  onNavigateView
}) => {
  const { user, role, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Overview', href: '#overview' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Hashrate Engine', href: '#hashrate-engine' },
    { name: 'Supported Assets', href: '#supported-assets' },
    { name: 'Security & Custody', href: '#security' },
    { name: 'Deposits & Payouts', href: '#treasury' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-dark-950/85 backdrop-blur-md border-b border-white/10 py-3 shadow-xl' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo */}
          <button 
            onClick={() => onNavigateView && onNavigateView(user ? 'dashboard' : 'landing')} 
            className="flex items-center gap-3 group focus:outline-none text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 via-gold-600 to-amber-900 p-[1px] shadow-gold-sm transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-dark-900 rounded-[11px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-gold-400 transition-colors group-hover:text-gold-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white font-mono flex items-center gap-1.5">
                QUIBANDS<span className="text-gold-400 font-sans font-light">GLOBAL</span>
              </span>
              <span className="text-[10px] tracking-widest text-slate-400 font-mono -mt-1">
                INSTITUTIONAL MINING
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-6">
            {user && onNavigateView && (
              <button
                onClick={() => onNavigateView('dashboard')}
                className={`text-xs font-bold font-mono px-3 py-1.5 rounded-lg border transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-gold-400/20 text-gold-400 border-gold-400/40 shadow-gold-sm'
                    : 'text-slate-300 border-transparent hover:text-white'
                }`}
              >
                📊 Dashboard
              </button>
            )}

            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => onNavigateView && onNavigateView('landing')}
                className="text-xs font-medium text-slate-300 hover:text-gold-400 transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Action Items */}
          <div className="hidden lg:flex items-center gap-3">
            
            <LanguageSelector variant="navbar" />

            {/* Support / Contact Modal Trigger */}
            <button
              onClick={onOpenContact}
              className="p-2 text-slate-400 hover:text-gold-400 rounded-lg hover:bg-white/5 transition-colors"
              title="24/7 Institutional Support Desk"
            >
              <Headphones className="w-4 h-4" />
            </button>

            {/* Authentication Buttons / User Profile Badge */}
            {user ? (
              <div className="flex items-center gap-3">
                
                {/* Deposit Action Trigger */}
                <button
                  onClick={onOpenDeposit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-gold-400 to-amber-600 text-dark-950 font-bold text-xs shadow-gold-sm hover:shadow-gold transition-all"
                  title="Make a Deposit"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>DEPOSIT</span>
                </button>

                {/* Withdraw Action Trigger */}
                {onOpenWithdrawal && (
                  <button
                    onClick={onOpenWithdrawal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs shadow-sm transition-all"
                    title="Request a Withdrawal"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                    <span>WITHDRAW</span>
                  </button>
                )}

                {role === 'admin' && (
                  <button
                    onClick={onOpenAdmin}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 text-xs font-semibold font-mono transition-all animate-pulse"
                    title="Open SuperAdmin Control Hub"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>ADMIN HUB</span>
                  </button>
                )}

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-850 border border-gold-500/30 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-white font-medium truncate max-w-[140px]">{user.email}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${role === 'admin' ? 'bg-gold-500 text-dark-950' : 'bg-dark-800 text-gold-400'}`}>
                    {role.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={signOut}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-rose-400 hover:bg-white/5 text-xs font-mono transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                {/* Sign In */}
                <button
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5 rounded-lg border border-white/10 transition-all duration-200"
                >
                  <LogIn className="w-4 h-4 text-gold-400" />
                  Sign In
                </button>

                {/* Launch App / Register */}
                <button
                  onClick={() => onOpenAuth('register')}
                  className="gold-gradient-btn flex items-center gap-2 px-5 py-2 rounded-lg text-sm shadow-gold-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Get Started</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSelector variant="compact" />

            {!user ? (
              <button
                onClick={() => onOpenAuth('register')}
                className="gold-gradient-btn px-3 py-1.5 rounded-lg text-xs font-bold shadow-gold-sm"
              >
                Start
              </button>
            ) : (
              <button
                onClick={onOpenDeposit}
                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-gold-400 to-amber-600 text-dark-950 font-bold text-[11px] flex items-center gap-1 shadow-gold-sm"
              >
                <Activity className="w-3 h-3" />
                <span>Deposit</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-dark-850 border border-white/10 text-slate-200 hover:text-white active:scale-95 transition-all"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-gold-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (High Z-Index Full Viewport Overlay) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[60px] sm:top-[68px] bottom-0 bg-dark-950/98 backdrop-blur-2xl border-b border-white/10 shadow-2xl z-50 overflow-y-auto overscroll-contain">
          <div className="px-5 py-5 space-y-4 max-w-md mx-auto">
            {/* Live System Status Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Institutional Node Active</span>
              </div>
              <button 
                onClick={() => { setMobileMenuOpen(false); onOpenContact(); }}
                className="text-xs text-gold-400 flex items-center gap-1.5 font-medium bg-gold-500/10 hover:bg-gold-500/20 px-3 py-1.5 rounded-xl border border-gold-500/20 transition"
              >
                <Headphones className="w-3.5 h-3.5" /> 24/7 Desk
              </button>
            </div>

            {/* Authenticated User Quick Actions on Mobile */}
            {user ? (
              <div className="p-4 rounded-2xl bg-dark-900/90 border border-gold-500/30 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-xs font-mono text-white truncate font-semibold">{user.email}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${role === 'admin' ? 'bg-gold-500 text-dark-950 font-black' : 'bg-dark-800 text-gold-400 border border-gold-400/30'}`}>
                    {role.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => { setMobileMenuOpen(false); onOpenDeposit && onOpenDeposit(); }}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-gold-400 to-amber-600 text-dark-950 font-bold text-xs shadow-gold-sm flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>DEPOSIT</span>
                  </button>

                  {onOpenWithdrawal && (
                    <button
                      onClick={() => { setMobileMenuOpen(false); onOpenWithdrawal(); }}
                      className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                      <span>WITHDRAW</span>
                    </button>
                  )}
                </div>

                {role === 'admin' && onOpenAdmin && (
                  <button
                    onClick={() => { setMobileMenuOpen(false); onOpenAdmin(); }}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs font-mono flex items-center justify-center gap-2 animate-pulse"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>OPEN ADMIN CONTROL HUB</span>
                  </button>
                )}

                {onNavigateView && (
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigateView('dashboard'); }}
                    className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold font-mono flex items-center justify-center gap-2 ${
                      currentView === 'dashboard'
                        ? 'bg-gold-400/20 text-gold-400 border-gold-400/40'
                        : 'bg-dark-850 text-slate-200 border-white/10'
                    }`}
                  >
                    <span>📊 INVESTOR DASHBOARD</span>
                  </button>
                )}
              </div>
            ) : null}

            {/* Navigation links */}
            <div className="grid gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateView) onNavigateView('landing');
                  }}
                  className="flex items-center justify-between py-2.5 px-3.5 rounded-xl text-slate-200 hover:text-gold-400 hover:bg-white/5 font-medium text-sm transition-colors"
                >
                  {link.name}
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </a>
              ))}
            </div>

            {/* Mobile Auth actions */}
            <div className="pt-3 border-t border-white/10">
              {user ? (
                <button
                  onClick={() => { setMobileMenuOpen(false); signOut(); }}
                  className="w-full py-3 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-sm font-semibold flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setMobileMenuOpen(false); onOpenAuth('login'); }}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/15 text-slate-200 text-sm font-semibold hover:bg-white/5 active:scale-95 transition"
                  >
                    <LogIn className="w-4 h-4 text-gold-400" />
                    Sign In
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onOpenAuth('register'); }}
                    className="gold-gradient-btn flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold shadow-gold-sm active:scale-95 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

