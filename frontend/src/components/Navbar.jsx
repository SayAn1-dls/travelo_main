import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AirplaneTilt, SignOut } from "@phosphor-icons/react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { label: "MISSIONS", path: "/trips" },
    { label: "LEDGER", path: "/bookings" },
    { label: "EXPLORE", path: "/explore" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] p-8 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-6 pointer-events-auto">
        <Link to="/dashboard" className="flex items-center gap-4 no-underline group bg-black border-4 border-white p-3 hover:border-brutal-orange transition-colors shadow-[6px_6px_0px_#FF4D00]">
            <div className="w-10 h-10 bg-brutal-orange flex items-center justify-center rotate-[-10deg] group-hover:rotate-0 transition-transform">
                <AirplaneTilt size={24} weight="fill" className="text-white" />
            </div>
            <span className="header-massive text-4xl text-white">TRAVELO.</span>
        </Link>
      </div>

      <div className="hidden lg:flex items-center gap-0 pointer-events-auto bg-white border-4 border-black shadow-[6px_6px_0px_#FF4D00]">
        {links.map((link) => {
            const active = location.pathname === link.path;
            return (
                <Link 
                    key={link.path} 
                    to={link.path} 
                    className={`font-bebas text-2xl px-8 py-4 no-underline transition-all border-r-4 border-black last:border-r-0 ${active ? 'bg-black text-white' : 'text-black hover:bg-brutal-orange hover:text-white'}`}
                >
                    {link.label}
                </Link>
            );
        })}
      </div>

      <div className="flex items-center gap-0 pointer-events-auto bg-black border-4 border-white shadow-[6px_6px_0px_#FF4D00]">
        <div className="hidden sm:flex flex-col items-end px-6 py-3 border-r-4 border-white/20">
            <span className="font-bebas text-2xl leading-none text-brutal-acid">{user.name?.split(' ')[0].toUpperCase() || 'OPERATIVE'}</span>
            <span className="font-black text-[9px] tracking-widest uppercase opacity-40 text-white">OPERATIVE</span>
        </div>
        <button 
            onClick={logout}
            className="w-14 h-14 bg-brutal-orange flex items-center justify-center hover:bg-white transition-colors group"
        >
            <SignOut size={24} weight="bold" className="text-white group-hover:text-black" />
        </button>
      </div>
    </nav>
  );
}
