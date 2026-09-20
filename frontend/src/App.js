import '@/App.css';
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import Navbar from '@/components/Navbar';
import NomadWidget from '@/components/NomadWidget';

// Eagerly load only what's needed above the fold
import Landing from '@/pages/Landing';
import AuthPage from '@/pages/AuthPage';

// Lazy-load everything else — splits bundle, speeds up initial load
const ExplorePage        = lazy(() => import('@/pages/ExplorePage'));
const DestinationPage    = lazy(() => import('@/pages/DestinationPage'));
const BookingPage        = lazy(() => import('@/pages/BookingPage'));
const PaymentSuccessPage = lazy(() => import('@/pages/PaymentSuccessPage'));
const PaymentCancelPage  = lazy(() => import('@/pages/PaymentCancelPage'));
const Dashboard          = lazy(() => import('@/pages/Dashboard'));
const TripPlannerPage    = lazy(() => import('@/pages/TripPlannerPage'));
const TripWizardPage     = lazy(() => import('@/pages/TripWizardPage'));
const TripDetailPage     = lazy(() => import('@/pages/TripDetailPage'));
const VibeLabPage        = lazy(() => import('@/pages/VibeLabPage'));
const SquadChatPage      = lazy(() => import('@/pages/SquadChatPage'));
const InvitePage         = lazy(() => import('@/pages/InvitePage'));
const ContactPage        = lazy(() => import('@/pages/ContactPage'));
const NotFound           = lazy(() => import('@/pages/NotFound'));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-ink">
    <span className="font-display text-4xl uppercase text-white/40 animate-pulse">Loading…</span>
  </div>
);

function NomadFloating() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user || location.pathname === '/vibe-lab' || location.pathname === '/squad') return null;
  return <NomadWidget />;
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname)}`} replace />;
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <div className="grain-overlay" aria-hidden="true" />
          <Navbar />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"                   element={<Landing />} />
              <Route path="/auth"               element={<AuthPage />} />
              <Route path="/explore"            element={<ExplorePage />} />
              <Route path="/destinations/:id"   element={<DestinationPage />} />
              <Route path="/book/:id"           element={<Protected><BookingPage /></Protected>} />
              <Route path="/payment/success"    element={<PaymentSuccessPage />} />
              <Route path="/payment/cancel"     element={<PaymentCancelPage />} />
              <Route path="/dashboard"          element={<Protected><Dashboard /></Protected>} />
              <Route path="/planner"            element={<Protected><TripPlannerPage /></Protected>} />
              <Route path="/planner/new"        element={<Protected><TripWizardPage /></Protected>} />
              <Route path="/planner/:id"        element={<Protected><TripDetailPage /></Protected>} />
              <Route path="/vibe-lab"           element={<Protected><VibeLabPage /></Protected>} />
              <Route path="/squad"              element={<Protected><SquadChatPage /></Protected>} />
              <Route path="/invite/:token"      element={<InvitePage />} />
              <Route path="/contact"            element={<ContactPage />} />
              <Route path="*"                   element={<NotFound />} />
            </Routes>
          </Suspense>
          <NomadFloating />
          <Toaster position="top-center" richColors duration={3500} closeButton />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
