import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AirplaneTilt, SignOut } from "@phosphor-icons/react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { label: "DASHBOARD", path: "/dashboard" },
    { label: "MISSIONS", path: "/trips" },
    { label: "LOGISTICS", path: "/book" },
    { label: "LEDGER", path: "/bookings" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] p-8 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-6 pointer-events-auto">
        <Link to="/dashboard" className="flex items-center gap-4 no-underline group bg-white/5 backdrop-blur-3xl border border-white/10 p-5 rounded-3xl shadow-2xl">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center rotate-[-10deg] group-hover:rotate-0 transition-transform">
            <AirplaneTilt size={24} weight="fill" className="text-white" />
          </div>
          <span className="text-4xl font-[900] text-white tracking-tighter font-bebas uppercase">TRAVELO.</span>
        </Link>
      </div>

      <div className="hidden lg:flex items-center gap-10 pointer-events-auto bg-black/60 backdrop-blur-3xl border border-white/10 p-4 rounded-[2rem] shadow-2xl">
        {links.map((link) => {
          const active = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`font-black text-[12px] tracking-[0.3em] px-8 py-3 no-underline transition-all ${active ? 'text-orange-500' : 'text-white/40 hover:text-white'}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-6 pointer-events-auto bg-white/5 backdrop-blur-3xl border border-white/10 p-4 rounded-[2rem] shadow-2xl">
        <div className="flex flex-col items-end px-6 border-r border-white/10">
          <span className="text-3xl font-[900] leading-none text-cyan-500 font-bebas italic">{user.name?.split(' ')[0]}</span>
          <span className="font-black text-[10px] tracking-[0.4em] uppercase opacity-20 mt-1">OPERATIVE</span>
        </div>
        <button onClick={logout} className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center hover:bg-orange-500 transition-all group">
          <SignOut size={28} weight="bold" className="text-orange-500 group-hover:text-white" />
        </button>
      </div>
    </nav>
  );
}
