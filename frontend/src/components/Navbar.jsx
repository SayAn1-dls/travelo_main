import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AirplaneTilt, User } from "@phosphor-icons/react";

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { label: "EXPLORE", path: "/explore" },
    { label: "MISSIONS", path: "/trips" },
    { label: "LOGISTICS", path: "/bookings" },
    { label: "CAPITAL", path: "/bookings-history" },
  ];

  return (
    <nav className="fixed top-6 inset-x-6 z-[1000]">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-[#050505]/80 backdrop-blur-3xl border border-white/10 px-8 py-4 rounded-[2.5rem] shadow-2xl">

        {/* LOGO */}
        <Link to="/dashboard" className="flex items-center gap-3 no-underline group">
          <div className="w-10 h-10 bg-sexy-orange rounded-xl flex items-center justify-center shadow-sexy-orange" style={{transform: 'rotate(-12deg)'}}>
            <AirplaneTilt size={22} weight="fill" className="text-white" />
          </div>
          <span className="goated-heading text-3xl uppercase tracking-tighter">travelo<span className="text-sexy-orange">.</span></span>
        </Link>

        {/* NAV LINKS */}
        <div className="hidden lg:flex items-center gap-10">
          {links.map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`goated-heading text-xl no-underline transition-all duration-200 ${
                  active
                    ? 'text-sexy-orange'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {link.label}
                {active && <span className="block w-full h-[2px] bg-sexy-orange mt-1 rounded-full" />}
              </Link>
            );
          })}
        </div>

        {/* USER PILL + AVATAR */}
        <div className="flex items-center gap-5">
          <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-sexy-yellow animate-pulse" />
            <span className="font-black text-[10px] tracking-[0.2em] uppercase text-white/70">
              {user?.name?.split(' ')[0]?.toUpperCase() || 'EXPLORER'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-full border-2 border-sexy-orange overflow-hidden shadow-sexy-orange cursor-pointer hover:scale-110 transition-transform flex-shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-sexy-orange/20 flex items-center justify-center">
                <User size={20} weight="bold" className="text-sexy-orange" />
              </div>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
}
