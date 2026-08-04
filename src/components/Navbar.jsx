import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AirplaneTilt, SignOut } from "@phosphor-icons/react";

export default function Navbar() {
  const { user, logout } = useAuth(); const location = useLocation();
  if (!user) return null;

  const links = [
    { label: "HQ", path: "/dashboard" },
    { label: "MISSIONS", path: "/trips" },
    { label: "LOGISTICS", path: "/book" },
    { label: "LEDGER", path: "/bookings" },
    { label: "VAULT", path: "/explore" },
    { label: "MAIL", path: "/squad-mail" },
    { label: "PAYMENT", path: "/payment" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] p-6 flex items-center justify-between">
      <Link to="/dashboard" className="flex items-center gap-3 no-underline bg-black/60 backdrop-blur-3xl border border-white/10 px-6 py-4 rounded-2xl shadow-2xl group transition-all hover:border-orange-500/50">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center rotate-[-10deg] group-hover:rotate-0 transition-transform"><AirplaneTilt size={24} weight="fill" /></div>
        <span className="text-3xl font-[900] font-bebas uppercase tracking-tighter">TRAVELO<span className="text-orange-500">.</span></span>
      </Link>

      <div className="hidden lg:flex items-center gap-2 bg-black/60 backdrop-blur-3xl border border-white/10 p-2 rounded-[2rem] shadow-2xl">
        {links.map((link) => (
          <Link key={link.path} to={link.path} className={`font-black text-[10px] tracking-[0.2em] px-6 py-3 rounded-xl no-underline transition-all ${location.pathname === link.path ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(255,77,0,0.3)]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}>
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4 bg-black/60 backdrop-blur-3xl border border-white/10 p-2 rounded-2xl shadow-2xl">
         <div className="flex flex-col items-end px-4 border-r border-white/10">
            <span className="text-xl font-[900] font-bebas text-cyan-500 italic">{user.name?.split(' ')[0]}</span>
            <span className="text-[8px] font-black text-white/20 uppercase">OPERATIVE</span>
         </div>
         <button onClick={logout} className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-all"><SignOut size={24} weight="bold" /></button>
      </div>
    </nav>
  );
}