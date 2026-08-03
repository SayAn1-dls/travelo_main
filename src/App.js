import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import BookingPage from "@/pages/BookingPage";
import TripsPage from "@/pages/TripsPage";
import RecapPage from "@/pages/RecapPage";
import TripMissionPage from "@/pages/TripMissionPage";
import PaymentPage from "@/pages/PaymentPage";
import ExplorePage from "@/pages/ExplorePage";
import SquadMailPage from "@/pages/SquadMailPage";
import NotFound from "@/pages/NotFound";

function Layout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return (
    <div className="min-h-screen bg-[#030303]">
      <Navbar />
      <div className="pt-24"><Outlet /></div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/bookings" element={<RecapPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/trips/:id" element={<TripMissionPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/squad-mail" element={<SquadMailPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-center" richColors theme="dark" duration={3000} closeButton />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
