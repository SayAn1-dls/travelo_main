import '@/App.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import Navbar from '@/components/Navbar';
import Landing from '@/pages/Landing';
import AuthPage from '@/pages/AuthPage';
import ExplorePage from '@/pages/ExplorePage';
import DestinationPage from '@/pages/DestinationPage';
import BookingPage from '@/pages/BookingPage';
import PaymentSuccessPage from '@/pages/PaymentSuccessPage';
import PaymentCancelPage from '@/pages/PaymentCancelPage';
import Dashboard from '@/pages/Dashboard';
import TripPlannerPage from '@/pages/TripPlannerPage';
import TripWizardPage from '@/pages/TripWizardPage';
import TripDetailPage from '@/pages/TripDetailPage';
import VibeLabPage from '@/pages/VibeLabPage';
import NotFound from '@/pages/NotFound';
import NomadWidget from '@/components/NomadWidget';

function NomadFloating() {
  const { user } = useAuth();
  const location = useLocation();
  // hidden on /vibe-lab (full NOMAD chat lives there) and for guests
  if (!user || location.pathname === '/vibe-lab') return null;
  return <NomadWidget />;
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <span className="font-display text-4xl uppercase text-white/40 animate-pulse">Loading…</span>
      </div>
    );
  }
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
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/destinations/:id" element={<DestinationPage />} />
            <Route path="/book/:id" element={<Protected><BookingPage /></Protected>} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/cancel" element={<PaymentCancelPage />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/planner" element={<Protected><TripPlannerPage /></Protected>} />
            <Route path="/planner/new" element={<Protected><TripWizardPage /></Protected>} />
            <Route path="/planner/:id" element={<Protected><TripDetailPage /></Protected>} />
            <Route path="/vibe-lab" element={<Protected><VibeLabPage /></Protected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <NomadFloating />
          <Toaster position="top-center" richColors duration={3500} closeButton />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
