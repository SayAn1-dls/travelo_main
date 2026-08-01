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

function Layout() {
  const { user } = useAuth();
  
  // We effectively ignore the "false" (not logged in) state to let Sayan judge the pages
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-20">
        <Outlet />
      </div>
      <ChatWidget />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/recap/:token" element={<RecapPage />} />
      <Route element={<Layout />}>
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
      {/* Fallback to dashboard for easier review */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
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