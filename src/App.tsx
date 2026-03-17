import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AppShell from './components/layout/AppShell';
import HomePage from './pages/HomePage';
import TransactionsPage from './pages/TransactionsPage';
import StockPage from './pages/StockPage';
import MorePage from './pages/MorePage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import { useThemeStore, applyTheme } from './stores/themeStore';
import { useAuthStore, useBusinessStore } from './stores/appStore';
import { supabase } from './lib/supabase';
import ContactsPage from './pages/ContactsPage';
import InvoicesPage from './pages/InvoicesPage';
import CreateInvoicePage from './pages/CreateInvoicePage';
import ReportsPage from './pages/ReportsPage';
import BusinessProfilePage from './pages/BusinessProfilePage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import InvoiceSettingsPage from './pages/InvoiceSettingsPage';
import PreferencesPage from './pages/PreferencesPage';
import MarketingPage from './pages/MarketingPage';
import DistributorPage from './pages/DistributorPage';
import InsightsPage from './pages/InsightsPage';
import TeamPage from './pages/TeamPage';
import SubscriptionPage from './pages/SubscriptionPage';
import PaymentsPage from './pages/PaymentsPage';
import WhatsAppPage from './pages/WhatsAppPage';
import { Loader2 } from 'lucide-react';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isOnboarded } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isOnboarded } = useAuthStore();

  if (isAuthenticated && isOnboarded) {
    return <Navigate to="/" replace />;
  }
  if (isAuthenticated && !isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function AppLoader() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 
          flex items-center justify-center shadow-glow-blue animate-pulse">
          <span className="text-white text-xl font-bold">BS</span>
        </div>
        <Loader2 size={20} className="text-blue-500 animate-spin" />
      </div>
    </div>
  );
}

export default function App() {
  const theme = useThemeStore((s) => s.theme);
  const { setUser, setOnboarded } = useAuthStore();
  const { setBusiness } = useBusinessStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (useThemeStore.getState().theme === 'system') applyTheme('system');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Auth session listener
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          setUser({ id: session.user.id, email: session.user.email ?? '' });

          // Check if onboarded
          const { data: biz } = await supabase
            .from('businesses')
            .select('id, business_name, business_type, business_category, owner_name, onboarding_completed')
            .eq('owner_id', session.user.id)
            .single();

          if (biz && biz.onboarding_completed) {
            setBusiness({
              id: biz.id,
              name: biz.business_name,
              type: biz.business_type,
              category: biz.business_category,
              ownerName: biz.owner_name,
            });
            setOnboarded(true);
          }
        }
      } catch (err) {
        console.error('Session load error:', err);
      } finally {
        if (mounted) setInitializing(false);
      }
    }

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setOnboarded(false);
        setBusiness(null);
      } else if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (initializing) return <AppLoader />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/auth" element={<GuestGuard><AuthPage /></GuestGuard>} />

        {/* Onboarding — auth required */}
<Route path="/onboarding" element={<AuthGuard><OnboardingPage /></AuthGuard>} />
<Route path="/invoices/create" element={<AuthGuard><CreateInvoicePage /></AuthGuard>} />
<Route path="/settings/business" element={<AuthGuard><BusinessProfilePage /></AuthGuard>} />
<Route path="/settings/payment-methods" element={<AuthGuard><PaymentMethodsPage /></AuthGuard>} />
<Route path="/settings/invoice" element={<AuthGuard><InvoiceSettingsPage /></AuthGuard>} />
<Route path="/settings/preferences" element={<AuthGuard><PreferencesPage /></AuthGuard>} />
<Route path="/marketing" element={<AuthGuard><MarketingPage /></AuthGuard>} />
<Route path="/distributors" element={<AuthGuard><DistributorPage /></AuthGuard>} />
        <Route path="/insights" element={<AuthGuard><InsightsPage /></AuthGuard>} />
<Route path="/team" element={<AuthGuard><TeamPage /></AuthGuard>} />
<Route path="/subscription" element={<AuthGuard><SubscriptionPage /></AuthGuard>} />
<Route path="/payments" element={<AuthGuard><PaymentsPage /></AuthGuard>} />
<Route path="/whatsapp" element={<AuthGuard><WhatsAppPage /></AuthGuard>} />

{/* Protected app */}
<Route element={<AuthGuard><AppShell /></AuthGuard>}>
  <Route path="/" element={<HomePage />} />
  <Route path="/transactions" element={<TransactionsPage />} />
  <Route path="/stock" element={<StockPage />} />
  <Route path="/contacts" element={<ContactsPage />} />
  <Route path="/more" element={<MorePage />} />
  <Route path="/invoices" element={<InvoicesPage />} />
  <Route path="/reports" element={<ReportsPage />} />
</Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
