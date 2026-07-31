import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AirplaneTilt, Bell, SignOut, SuitcaseRolling, House, Compass, Wallet } from "@phosphor-icons/react";
import { useLocation } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { icon: House, label: "Home", path: "/dashboard" },
    { icon: SuitcaseRolling, label: "Trips", path: "/trips" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: Wallet, label: "Bookings", path: "/bookings-history" },
  ];

  return (
    <nav className="fixed top-6 inset-x-6 z-[100]">
      <div className="max-w-6xl mx-auto flex items-center justify-between bg-white/80 backdrop-blur-2xl border border-white/40 px-6 py-3 rounded-full shadow-2xl shadow-black/5">
        <Link to="/dashboard" className="flex items-center gap-2 no-underline group">
          <div className="w-10 h-10 bg-[#FF5A36] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:rotate-12 transition-transform">
            <AirplaneTilt size={24} weight="fill" className="text-white" />
          </div>
          <span className="font-black text-2xl tracking-tighter text-[#0A2540] hidden sm:block">travelo<span className="text-[#FF5A36]">.</span></span>
        </Link>

        <div className="flex items-center bg-slate-100/50 p-1.5 rounded-full border border-slate-200/50">
          {links.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest no-underline transition-all ${active ? 'bg-white text-[#FF5A36] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <link.icon size={18} weight={active ? "fill" : "bold"} />
                <span className="hidden md:block">{link.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
            <Bell size={24} weight="bold" />
          </button>
          <div className="h-8 w-px bg-slate-200" />
          <Avatar className="w-10 h-10 border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-[#FF5A36] text-white font-black">{user.name?.[0]}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );
}
