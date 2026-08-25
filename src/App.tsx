import { useState, useEffect } from 'react';

import { Navbar } from './components/layout/Navbar';
import { LiveMarketTicker } from './components/landing/LiveMarketTicker';
import { HeroSection } from './components/landing/HeroSection';
import { MiningCalculator } from './components/landing/MiningCalculator';

import { SupportedAssets } from './components/landing/SupportedAssets';
import { AboutPlatform } from './components/landing/AboutPlatform';
import { DepositWithdrawalInfo } from './components/landing/DepositWithdrawalInfo';
import { SecurityArchitecture } from './components/landing/SecurityArchitecture';
import { FAQSection } from './components/landing/FAQSection';
import { Footer } from './components/layout/Footer';
import { ContactSupportModal } from './components/landing/ContactSupportModal';
import { AuthModal } from './components/auth/AuthModal';
import { AdminControlHub } from './components/admin/AdminControlHub';
import { DepositModal } from './components/dashboard/DepositModal';
import { WithdrawalModal } from './components/dashboard/WithdrawalModal';
import { ConvertModal } from './components/dashboard/ConvertModal';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';

import { LanguageProvider } from './context/LanguageContext';
import { AuthMode } from './types';

import { Headphones } from 'lucide-react';



function MainAppContent() {
  const { user, role } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const [contactModalOpen, setContactModalOpen] = useState(false);
  
  const [adminHubOpen, setAdminHubOpenState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('quibands_admin_open') === 'true' || window.location.hash.includes('admin');
    }
    return false;
  });

  const setAdminHubOpen = (open: boolean) => {
    setAdminHubOpenState(open);
    if (typeof window !== 'undefined') {
      if (open) {
        localStorage.setItem('quibands_admin_open', 'true');
        if (!window.location.hash.includes('admin')) {
          window.history.replaceState(null, '', '#admin');
        }
      } else {
        localStorage.removeItem('quibands_admin_open');
        if (window.location.hash.includes('admin')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    }
  };

  useEffect(() => {
    if (user && (role === 'admin' || role === 'moderator')) {
      if (localStorage.getItem('quibands_admin_open') === 'true' || window.location.hash.includes('admin')) {
        setAdminHubOpenState(true);
      }
    } else if (!user) {
      setAdminHubOpenState(false);
    }
  }, [user, role]);

  // Auto-open registration modal when visitor arrives via referral link
  useEffect(() => {
    if (typeof window !== 'undefined' && !user) {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('ref') || params.get('referral')) {
          setAuthMode('register');
          setAuthModalOpen(true);
        }
      } catch (e) {
        // url search param catch
      }
    }
  }, [user]);


  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [withdrawalBalances, setWithdrawalBalances] = useState<{ deposit: number; profit: number; main: number }>({ deposit: 0, profit: 0, main: 0 });
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertBalances, setConvertBalances] = useState<{ deposit: number; profit: number; main: number }>({ deposit: 0, profit: 0, main: 0 });
  const [currentView, setCurrentView] = useState<'dashboard' | 'landing'>('dashboard');

  const handleOpenWithdrawal = (deposit?: number, profit?: number, main?: number) => {
    const depVal = deposit || 0;
    const profVal = profit || 0;
    const mainVal = main !== undefined && main > 0 ? main : depVal + profVal;
    setWithdrawalBalances({ deposit: depVal, profit: profVal, main: mainVal });
    setWithdrawalModalOpen(true);
  };

  const handleOpenConvert = (deposit?: number, profit?: number, main?: number) => {
    const depVal = deposit || 0;
    const profVal = profit || 0;
    const mainVal = main !== undefined && main > 0 ? main : depVal + profVal;
    setConvertBalances({ deposit: depVal, profit: profVal, main: mainVal });
    setConvertModalOpen(true);
  };


  const handleOpenAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleSuccessAuth = (email: string) => {
    // Automatically route to investor dashboard upon login
    setCurrentView('dashboard');
  };

  const handleScrollToCalculator = () => {
    const el = document.getElementById('hashrate-engine');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-gold-500/30 selection:text-gold-300">
      

      {/* Top Navbar */}
      <Navbar 
        onOpenAuth={handleOpenAuth} 
        onOpenContact={() => setContactModalOpen(true)}
        onOpenAdmin={() => setAdminHubOpen(true)}
        onOpenDeposit={() => setDepositModalOpen(true)}
        onOpenWithdrawal={handleOpenWithdrawal}
        currentView={currentView}
        onNavigateView={(view) => setCurrentView(view)}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        {user && currentView === 'dashboard' ? (
          /* Authenticated Investor Dashboard View */
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-16">
            <UserDashboard 
              onOpenDeposit={() => setDepositModalOpen(true)}
              onOpenConvert={handleOpenConvert}
              onOpenWithdrawal={handleOpenWithdrawal}
              onOpenCalculator={handleScrollToCalculator}
              onOpenAdmin={() => setAdminHubOpen(true)}
            />
          </div>
        ) : (
          /* Public Landing Page & Simulator View */
          <>

            {/* Hero Section */}
            <HeroSection 
              onOpenAuth={handleOpenAuth} 
              onOpenCalculator={handleScrollToCalculator} 
            />

            {/* Live Crypto & Mining Difficulty Ticker */}
            <LiveMarketTicker />

            {/* Interactive Hashrate & Yield Estimator Simulator (No Fixed Cards) */}
            <MiningCalculator 
              onOpenAuth={handleOpenAuth} 
            />


            {/* Supported Cryptocurrencies & Networks */}
            <SupportedAssets 
              onOpenAuth={handleOpenAuth} 
            />

            {/* About the Platform & Green Datacenter Infrastructure */}
            <AboutPlatform />

            {/* Transparent Deposit, Withdrawal & Segregated Ledger Protocol */}
            <DepositWithdrawalInfo 
              onOpenAuth={handleOpenAuth} 
            />

            {/* Security, Cold Storage & Non-Custodial Architecture */}
            <SecurityArchitecture />

            {/* FAQ Section */}
            <FAQSection 
              onOpenContact={() => setContactModalOpen(true)} 
            />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer 
        onOpenContact={() => setContactModalOpen(true)} 
        onOpenAuth={handleOpenAuth} 
      />

      {/* Modals */}

      <AuthModal

        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccessAuth={handleSuccessAuth}
      />

      <ContactSupportModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />

      {/* User Deposit Modal */}
      <DepositModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
      />

      {/* Mine Currency Convert Modal */}
      <ConvertModal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        onOpenContact={() => setContactModalOpen(true)}
        depositBalance={convertBalances.deposit}
        miningBalance={convertBalances.profit}
        mainBalance={convertBalances.main}
      />

      {/* User Withdrawal Modal */}
      <WithdrawalModal
        isOpen={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
        onOpenContact={() => setContactModalOpen(true)}
        mainBalance={withdrawalBalances.main}
        profitBalance={withdrawalBalances.profit}
      />

      {/* Institutional Admin Control Hub */}
      <AdminControlHub
        isOpen={adminHubOpen}
        onClose={() => setAdminHubOpen(false)}
      />




    </div>
  );

}

export function App() {

  return (
    <LanguageProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

