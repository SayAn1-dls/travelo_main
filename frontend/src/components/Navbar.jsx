import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AirplaneTilt, SignOut, List, X } from "@phosphor-icons/react";
import { useState } from "react";

// v3.0: Full mobile nav with hamburger + 7-link layout
export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const links = [
    { label: "HQ", path: "/dashboard" },
    { label: "MISSIONS", path: "/trips" },
    { label: "LOGISTICS", path: "/book" },
    { label: "LEDGER", path: "/bookings" },
    { label: "MEMORIES", path: "/explore" },
    { label: "SQUAD MAIL", path: "/squad-mail" },
    { label: "PAYMENT", path: "/payment" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[1000] p-5 md:p-6 flex items-center justify-between pointer-events-none">
        <Link to="/dashboard" className="pointer-events-auto flex items-center gap-3 no-underline bg-black/60 backdrop-blur-3xl border border-white/10 px-5 py-3 rounded-2xl shadow-2xl group">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center rotate-[-10deg] group-hover:rotate-0 transition-transform shadow-lg shadow-orange-500/30">
            <AirplaneTilt size={20} weight="fill" className="text-white" />
          </div>
          <span className="text-3xl font-[900] text-white tracking-tighter font-bebas uppercase">TRAVELO.</span>
        </Link>

        <div className="hidden lg:flex items-center gap-1 pointer-events-auto bg-black/60 backdrop-blur-3xl border border-white/10 p-2 rounded-[1.5rem] shadow-2xl">
          {links.map((link) => {
            const active = location.pathname === link.path || (link.path !== '/dashboard' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`font-black text-[10px] tracking-[0.2em] px-5 py-3 rounded-xl no-underline transition-all whitespace-nowrap ${
                  active ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(255,77,0,0.3)]' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="hidden md:flex items-center gap-3 bg-black/60 backdrop-blur-3xl border border-white/10 p-3 rounded-2xl shadow-2xl">
            <div className="flex flex-col items-end px-4 border-r border-white/10">
              <span className="text-2xl font-[900] leading-none text-cyan-500 font-bebas italic">{user.name?.split(' ')[0]}</span>
              <span className="font-black text-[8px] tracking-[0.4em] uppercase opacity-20 mt-1">OPERATIVE</span>
            </div>
            <button onClick={logout} className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center hover:bg-orange-500 transition-all group">
              <SignOut size={22} weight="bold" className="text-orange-500 group-hover:text-white" />
            </button>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-12 h-12 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-xl flex items-center justify-center"
          >
            <List size={24} weight="bold" className="text-white/60" />
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-[2000] bg-[#030303]/95 backdrop-blur-3xl flex flex-col p-8">
          <div className="flex justify-between items-center mb-12">
            <span className="text-4xl font-[900] font-bebas text-white uppercase">TRAVELO.</span>
            <button onClick={() => setMobileOpen(false)} className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
              <X size={28} weight="bold" className="text-white/60" />
            </button>
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {links.map(link => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`no-underline py-6 px-8 rounded-2xl font-[900] text-3xl font-bebas uppercase italic transition-all ${
                    active ? 'bg-orange-500 text-white' : 'text-white/30 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <button onClick={logout} className="flex items-center gap-4 py-6 px-8 text-white/30 font-black uppercase tracking-widest text-sm">
            <SignOut size={24} /> LOGOUT
          </button>
        </div>
      )}
    </>
  );