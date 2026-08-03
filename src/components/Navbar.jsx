import { Link, useNavigate, useLocation } from "react-router-dom";
import { AirplaneTilt, ChatCircleDots, Globe, MapPin, Receipt, CreditCard, SignOut } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const NAV_LINKS = [
  { to: "/dashboard", label: "HQ" },
  { to: "/trips", label: "MISSIONS" },
  { to: "/explore", label: "EXPLORE" },
  { to: "/book", label: "LOGISTICS" },
  { to: "/bookings", label: "LEDGER" },
  { to: "/payment", label: "BOARDING" },
  { to: "/squad-mail", label: "SQUAD MAIL" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success("SESSION ENDED. SEE YOU NEXT MISSION.");
    navigate("/");
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-[100] px-10 py-6 flex items-center justify-between bg-[#030303]/80 backdrop-blur-3xl border-b border-white/5">
      <Link to="/dashboard" className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
          <AirplaneTilt size={22} weight="fill" className="text-white" />
        </div>
        <span className="text-3xl font-[900] tracking-tighter font-bebas uppercase">travelo.</span>
      </Link>
      <div className="hidden lg:flex items-center gap-2">
        {NAV_LINKS.map(({ to, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link key={to} to={to}>
              <button className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs font-bebas transition-all ${isActive ? "bg-orange-500 text-white" : "text-white/30 hover:text-white hover:bg-white/5"}`}>{label}</button>
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-6">
        <span className="text-white/30 font-black uppercase text-xs tracking-[0.3em] hidden md:block font-bebas">{user?.name?.split(" ")[0]}</span>
        <button onClick={handleLogout} className="text-white/20 hover:text-red-400 transition-colors" title="Sign Out">
          <SignOut size={24} weight="bold" />
        </button>
      </div>
    </nav>
  );
}
