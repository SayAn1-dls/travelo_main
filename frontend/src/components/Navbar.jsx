import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Plane, Menu, X } from 'lucide-react';

const linkClass = ({ isActive }) =>
  `font-mono text-xs uppercase tracking-[0.25em] transition hover:text-blaze ${isActive ? 'text-blaze' : 'text-white/70'}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
          <span className="flex h-8 w-8 items-center justify-center bg-blaze text-black">
            <Plane className="h-4 w-4" />
          </span>
          <span className="font-display text-2xl tracking-wide text-white">TRAVELO</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/explore" className={linkClass} data-testid="nav-explore">Explore</NavLink>
          {user && <NavLink to="/planner" className={linkClass} data-testid="nav-planner">Trip Planner</NavLink>}
          {user && <NavLink to="/dashboard" className={linkClass} data-testid="nav-dashboard">My Trips</NavLink>}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="font-mono text-xs uppercase tracking-widest text-white/50" data-testid="nav-username">
                {user.name.split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                className="border border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white transition hover:border-blaze hover:text-blaze"
                data-testid="nav-logout"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/70 transition hover:text-white"
                data-testid="nav-signin"
              >
                Sign In
              </Link>
              <Link
                to="/auth?mode=register"
                className="bg-blaze px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-black transition hover:bg-blaze-hover"
                data-testid="nav-getstarted"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-white" onClick={() => setOpen(!open)} data-testid="nav-mobile-toggle">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-ink px-5 py-6 md:hidden">
          <div className="flex flex-col gap-5">
            <NavLink to="/explore" className={linkClass} onClick={() => setOpen(false)}>Explore</NavLink>
            {user && <NavLink to="/planner" className={linkClass} onClick={() => setOpen(false)}>Trip Planner</NavLink>}
            {user && <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>My Trips</NavLink>}
            {user ? (
              <button onClick={handleLogout} className="w-fit border border-white/20 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white">
                Logout
              </button>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="w-fit bg-blaze px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest text-black">
                Get Started
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
