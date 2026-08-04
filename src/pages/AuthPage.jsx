import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, AirplaneTilt } from "@phosphor-icons/react";
import { toast } from "sonner";

const QUOTES = [
  '"DON\'T BE THE ONE WHO STAYED HOME."',
  '"THE GROUP CHAT IS WAITING. LOG IN."',
  '"YOUR PASSPORT IS BORED. FIX THAT."',
  '"ADVENTURES DON\'T BOOK THEMSELVES."',
];

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        toast.success("OPERATIVE AUTHENTICATED. WELCOME BACK.");
      } else {
        if (!form.name) return toast.error("NAME REQUIRED, OPERATIVE.");
        await register(form.name, form.email, form.password);
        toast.success("OPERATIVE CREATED. LET'S GO.");
      }
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "AUTH FAILED. TRY AGAIN.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      await login("demo@travelo.app", "demo");
      navigate("/dashboard");
    } catch {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 md:p-10 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(at_0%_0%,rgba(255,77,0,0.08)_0%,transparent_50%),radial-gradient(at_100%_100%,rgba(0,240,255,0.04)_0%,transparent_50%)] pointer-events-none" />

      <div className="w-full max-w-xl relative z-10">
        <div className="flex items-center justify-center gap-4 mb-16">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
            <AirplaneTilt size={28} weight="fill" className="text-white" />
          </div>
          <span className="text-5xl font-[900] font-bebas uppercase text-white tracking-tighter">TRAVELO.</span>
        </div>

        <header className="text-center mb-16">
          <h1 className="text-[12vw] md:text-[8vw] font-[900] leading-none mb-4 uppercase font-bebas text-white">
            {mode === "login" ? "WELCOME" : "JOIN THE"}
            <br />
            <span className="text-orange-500 italic">{mode === "login" ? "BACK." : "SQUAD."}</span>
          </h1>
          <p className="text-white/30 font-bold uppercase tracking-widest text-sm italic mt-8">{quote}</p>
        </header>

        <div className="silicon-glass">
          <div className="flex gap-2 mb-12 bg-white/[0.03] border border-white/5 p-2 rounded-2xl">
            {["login", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-5 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${
                  mode === m
                    ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(255,77,0,0.3)]"
                    : "text-white/30 hover:text-white"
                }`}
              >
                {m === "login" ? "LOGIN" : "SIGN UP"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {mode === "signup" && (
              <div className="space-y-3">
                <label className="silicon-label">Operative Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="SAYAN"
                  className="silicon-input"
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="silicon-label">Operative Comms *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="SAYAN@TRAVELO.APP"
                className="silicon-input"
              />
            </div>

            <div className="space-y-3">
              <label className="silicon-label">Secret Key *</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="silicon-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-launch py-10 text-3xl rounded-[2rem] disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-4">
                  <span className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  AUTHENTICATING...
                </span>
              ) : (
                <>
                  {mode === "login" ? "ENTER HQ" : "JOIN SQUAD"}{" "}
                  <ArrowRight size={40} weight="bold" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center space-y-4">
            <button
              onClick={handleDemoLogin}
              className="text-white/20 font-bold text-sm uppercase tracking-widest hover:text-orange-500 transition-colors italic underline underline-offset-4"
            >
              Skip — Enter as Demo Operative
            </button>
            <p className="text-white/10 font-bold text-xs uppercase tracking-widest">
              Zero network · 100% local · Presentation ready
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
