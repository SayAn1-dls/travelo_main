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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]" data-testid="auth-callback-loading">
      <AirplaneTilt size={40} weight="duotone" className="text-[#E25822] animate-pulse" />
      <p className="font-display text-2xl font-bold mt-4">Signing you in…</p>
    </div>
  );
}
