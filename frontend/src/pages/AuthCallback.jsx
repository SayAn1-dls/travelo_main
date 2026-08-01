import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AirplaneTilt } from "@phosphor-icons/react";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const processed = useRef(false);
  const navigate = useNavigate();
  const { googleSession } = useAuth();

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const sid = new URLSearchParams(window.location.hash.slice(1)).get("session_id");
    if (!sid) return navigate("/auth", { replace: true });
    googleSession(sid)
      .then((u) => navigate("/dashboard", { replace: true, state: { user: u } }))
      .catch(() => navigate("/auth", { replace: true }));
  }, [googleSession, navigate]);

  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }} data-testid="auth-callback-loading">
      <div style={{ width: 52, height: 52, background: "#FF4D00", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 1.5s ease-in-out infinite", transform: "rotate(-10deg)" }}>
        <AirplaneTilt size={28} weight="fill" color="white" />
      </div>
      <p style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 28, color: "white", letterSpacing: "0.1em", margin: 0 }}>
        BOARDING...
      </p>
      <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 18, color: "#444444", margin: 0 }}>
        "Getting your passport stamped."
      </p>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}
