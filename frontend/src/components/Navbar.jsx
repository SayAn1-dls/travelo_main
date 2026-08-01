import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AirplaneTilt, SignOut } from "@phosphor-icons/react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const links = [
    { label: "EXPLORE", path: "/explore" },
    { label: "TRIPS", path: "/trips" },
    { label: "BOOK", path: "/bookings" },
    { label: "LEDGER", path: "/bookings-history" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: "#080808",
      borderBottom: "2px solid #111111",
      padding: "0 32px",
      height: 64,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}>
      <Link to="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, background: "#FF4D00", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-10deg)" }}>
          <AirplaneTilt size={20} weight="fill" color="white" />
        </div>
        <span style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 22, color: "white", letterSpacing: "0.05em" }}>
          TRAVELO<span style={{ color: "#FF4D00" }}>.</span>
        </span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {links.map(link => {
          const active = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              style={{
                textDecoration: "none",
                fontFamily: "Anton, Impact, sans-serif",
                fontSize: 13,
                letterSpacing: "0.1em",
                color: active ? "#FF4D00" : "#555555",
                padding: "8px 16px",
                borderRadius: 6,
                background: active ? "rgba(255,77,0,0.08)" : "transparent",
                transition: "all 0.15s",
                border: active ? "1px solid rgba(255,77,0,0.2)" : "1px solid transparent",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#F0F0F0"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#555555"; }}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#111111", border: "1px solid #1E1E1E", borderRadius: 8, padding: "8px 14px" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F5FF50" }} />
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 12, color: "#888888", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {user?.name?.split(' ')[0] || "Traveler"}
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "transparent",
            border: "1px solid #1E1E1E",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "#555555",
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: 12,
            fontWeight: 700,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#FF4D00"; e.currentTarget.style.color = "#FF4D00"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E1E"; e.currentTarget.style.color = "#555555"; }}
        >
          <SignOut size={14} />
          OUT
        </button>
      </div>
    </nav>
  );
}
