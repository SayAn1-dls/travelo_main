import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import ChatWidget from "@/components/ChatWidget";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import BookingPage from "@/pages/BookingPage";
import BookingsHistory from "@/pages/BookingsHistory";
import TicketPage from "@/pages/TicketPage";
import ExplorePage from "@/pages/ExplorePage";
import DestinationHub from "@/pages/DestinationHub";
import TripsPage from "@/pages/TripsPage";
import TripDetail from "@/pages/TripDetail";
import { PaymentSuccess, PaymentCancel } from "@/pages/PaymentStatus";
import AuthCallback from "@/pages/AuthCallback";
import RecapPage from "@/pages/RecapPage";

function ProtectedLayout() {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="font-display text-2xl text-[#FF5A36] animate-pulse">Travelo</div>
      </div>
    );
  if (user === false) return <Navigate to="/auth" replace />;
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Outlet />
      <ChatWidget />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/recap/:token" element={<RecapPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/bookings" element={<BookingsHistory />} />
        <Route path="/ticket/:id" element={<TicketPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/destinations/:slug" element={<DestinationHub />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:id" element={<TripDetail />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
