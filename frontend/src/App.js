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

function Layout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  
  return (
    <div className="min-h-screen bg-[#030303]">
      <Navbar />
      <Outlet />
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
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster position="top-center" richColors theme="dark" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
