import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import { AirplaneTilt, ArrowRight, GoogleLogo } from "@phosphor-icons/react";

const BG = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=85";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiError(err));
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex" }}>

      {/* LEFT — Full-bleed travel photo */}
      <div style={{ flex: 1, display: "none", position: "relative", overflow: "hidden", minWidth: 0 }} className="hidden lg:block">
        <img src={BG} alt="Travel" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 40%, #080808 100%), linear-gradient(to top, #080808 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", top: 40, left: 40, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, background: "#FF4D00", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-10deg)" }}>
            <AirplaneTilt size={24} weight="fill" color="white" />
          </div>
          <span style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 28, color: "white", letterSpacing: "0.05em" }}>TRAVELO<span style={{ color: "#FF4D00" }}>.</span></span>
        </div>
        <div style={{ position: "absolute", bottom: 60, left: 48, right: 48 }}>
          <div style={{ display: "inline-block", background: "#FF4D00", padding: "4px 12px", marginBottom: 16, borderRadius: 4 }}>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.2em", color: "white", textTransform: "uppercase" }}>GATE 01 — TRAVELO</span>
          </div>
          <h2 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: "clamp(48px, 5vw, 80px)", color: "white", lineHeight: 0.9, margin: "0 0 20px" }}>NEXT STOP:<br /><span style={{ color: "#FF4D00" }}>EVERYWHERE.</span></h2>
          <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 26, color: "#F5FF50", margin: 0 }}>"Your OOO message is overdue."</p>
        </div>
      </div>

      {/* RIGHT — Auth form */}
      <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 48px", position: "relative" }} className="lg:w-[520px]">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }} className="lg:hidden">
          <div style={{ width: 36, height: 36, background: "#FF4D00", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-10deg)" }}>
            <AirplaneTilt size={20} weight="fill" color="white" />
          </div>
          <span style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 24, color: "white" }}>TRAVELO<span style={{ color: "#FF4D00" }}>.</span></span>
        </div>

        <div style={{ background: "#111111", border: "2px solid #222222", borderRadius: 20, padding: "40px 36px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "repeating-linear-gradient(90deg, #FF4D00 0px, #FF4D00 20px, transparent 20px, transparent 36px)" }} />

          <div style={{ marginBottom: 32 }}>
            <p style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.3em", color: "#555555", textTransform: "uppercase", marginBottom: 12 }}>TRAVELO — BOARDING PASS</p>
            <h1 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: "clamp(40px, 6vw, 64px)", color: "white", lineHeight: 0.9, margin: "0 0 12px", whiteSpace: "pre-line" }}>
              {mode === "login" ? "WELCOME\nBACK" : "JOIN THE\nSQUAD"}
            </h1>
            <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 20, color: "#FF4D00", margin: 0 }}>
              {mode === "login" ? '"Your bags are missed."' : '"Free passport. No stamps needed."'}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#1E1E1E" }} />
            <span style={{ fontFamily: "Anton, sans-serif", fontSize: 12, color: "#333333", letterSpacing: "0.2em" }}>SECURITY CHECK</span>
            <div style={{ flex: 1, height: 1, background: "#1E1E1E" }} />
          </div>

          <button onClick={() => { const r = window.location.origin + "/dashboard"; window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(r)}`; }} style={{ width: "100%", background: "white", color: "#080808", border: "none", borderRadius: 10, padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 24, transition: "opacity 0.15s" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.9"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            <GoogleLogo size={20} weight="bold" /> Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: "#1E1E1E" }} />
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 12, color: "#404040", fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#1E1E1E" }} />
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "register" && (
              <div>
                <label style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 11, letterSpacing: "0.15em", color: "#555555", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Full Name</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Sayan Das" className="field" />
              </div>
            )}
            <div>
              <label style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 11, letterSpacing: "0.15em", color: "#555555", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Email</label>
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="explorer@travelo.app" className="field" />
            </div>
            <div>
              <label style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 11, letterSpacing: "0.15em", color: "#555555", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Password</label>
              <input required type="password" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="field" />
            </div>
            {error && (
              <div style={{ background: "rgba(255,45,107,0.08)", border: "1.5px solid rgba(255,45,107,0.25)", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ color: "#FF2D6B", fontSize: 16, flexShrink: 0 }}>⚠</span>
                <div>
                  <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 12, color: "#FF2D6B", margin: "0 0 2px" }}>
                    {(error.toLowerCase().includes("500") || error.toLowerCase().includes("network")) ? "Backend is offline — try Google login instead" : error}
                  </p>
                  {(error.toLowerCase().includes("500") || error.toLowerCase().includes("network")) && (
                    <p style={{ fontFamily: "Caveat, cursive", fontSize: 14, color: "#666666", margin: 0 }}>"Even airports have delays."</p>
                  )}
                </div>
              </div>
            )}
            <button type="submit" disabled={loading} style={{ width: "100%", background: loading ? "#222222" : "#FF4D00", color: "white", border: "2px solid #FF4D00", borderRadius: 10, padding: "17px", fontFamily: "Anton, Impact, sans-serif", fontSize: 18, letterSpacing: "0.1em", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.15s", marginTop: 4 }} onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#FF4D00"; } }} onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = "#FF4D00"; e.currentTarget.style.color = "white"; } }}>
              {loading ? "PROCESSING..." : mode === "login" ? "BOARD THE PLANE" : "GRAB YOUR TICKET"}
            </button>
          </form>

          <p style={{ marginTop: 28, textAlign: "center", fontFamily: "Space Grotesk, sans-serif", fontSize: 14, color: "#555555" }}>
            {mode === "login" ? "New traveler?" : "Already exploring?"}{" "}
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#00E5FF", fontWeight: 700, fontSize: 14, padding: 0, fontFamily: "Space Grotesk, sans-serif", textDecoration: "underline" }} onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </p>
        </div>

        <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 18, color: "#333333", textAlign: "center", marginTop: 32 }}>
          "Life is short. Passport stamps are forever."
        </p>
      </div>
    </div>
  );
}
