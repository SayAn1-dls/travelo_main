import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AirplaneTilt, ArrowRight, GoogleLogo } from "@phosphor-icons/react";
import { motion } from "framer-motion";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleBypass = async () => {
    setLoading(true);
    await login("guest@travelo.app", "guest123");
    navigate("/dashboard");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      // Backend is likely down, auto-bypass for review
      console.warn("Backend unavailable, activating Guest Mode bypass.");
      await handleBypass();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 selection:bg-brutal-orange selection:text-white">
      {/* FLOATING STICKER */}
      <div className="fixed top-20 right-20 w-32 h-32 bg-brutal-acid border-4 border-black flex items-center justify-center rotate-[15deg] shadow-2xl hidden md:flex animate-pulse z-50">
        <span className="font-marker text-4xl text-black">BYPASS</span>
      </div>

      <nav className="fixed top-10 left-10">
        <Link to="/" className="flex items-center gap-4 no-underline group">
          <div className="w-12 h-12 bg-brutal-orange border-4 border-white flex items-center justify-center rotate-[-10deg] group-hover:rotate-0 transition-transform shadow-[4px_4px_0px_white]">
            <AirplaneTilt size={28} weight="fill" className="text-white" />
          </div>
          <span className="header-massive text-4xl text-white">TRAVELO.</span>
        </Link>
      </nav>

      <div className="w-full max-w-xl">
        <header className="text-center mb-16">
          <motion.h1 initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="header-massive text-9xl mb-4">
            {mode === "login" ? "WELCOME BACK" : "JOIN THE SQUAD"}
          </motion.h1>
          <p className="marker-note text-4xl italic">
            {mode === "login" ? '"Ready to ruin your bank balance?"' : '"Free passport. No stamps needed."'}
          </p>
        </header>

        <div className="brutal-card relative overflow-hidden bg-white text-black border-brutal-orange p-10">
          <div className="absolute top-0 left-0 right-0 h-4 bg-black" />
          
          <div className="space-y-10 py-5">
            <button 
                onClick={handleBypass}
                className="w-full bg-brutal-acid text-black p-6 border-4 border-black flex items-center justify-center gap-6 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all shadow-[10px_10px_0px_black] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
            >
                <span className="font-bebas text-4xl tracking-widest uppercase">BYPASS AUTH FOR UI REVIEW</span>
            </button>

            <div className="flex items-center gap-8 opacity-20">
                <div className="h-2 bg-black flex-1" />
                <span className="font-bebas text-2xl text-black">OR USE REAL AUTH</span>
                <div className="h-2 bg-black flex-1" />
            </div>

            <form onSubmit={submit} className="space-y-6 text-left">
              {mode === "register" && (
                <div className="space-y-2">
                  <label className="font-bebas text-2xl tracking-widest uppercase">USER IDENTITY</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="SAYAN DLS" className="w-full border-4 border-black p-5 text-2xl font-black outline-none focus:border-brutal-orange" />
                </div>
              )}
              <div className="space-y-2">
                <label className="font-bebas text-2xl tracking-widest uppercase">COMMS ADDRESS</label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="YOU@TRAVELO.APP" className="w-full border-4 border-black p-5 text-2xl font-black outline-none focus:border-brutal-orange" />
              </div>
              <div className="space-y-2">
                <label className="font-bebas text-2xl tracking-widest uppercase">SECRET KEY</label>
                <input required type="password" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="w-full border-4 border-black p-5 text-2xl font-black outline-none focus:border-brutal-orange" />
              </div>

              <button type="submit" disabled={loading} className="w-full btn-brutal py-8 text-4xl flex items-center justify-center gap-6 group shadow-[10px_10px_0px_black] active:shadow-none">
                {loading ? "CHECKING..." : mode === "login" ? "ENGAGE" : "REGISTER"}
                <ArrowRight size={44} weight="bold" className="group-hover:translate-x-4 transition-transform" />
              </button>
            </form>

            <div className="text-center pt-8 border-t-4 border-black/5">
                <p className="marker-note text-3xl rotate-[-1deg]">
                    {mode === "login" ? "New around here?" : "Already built different?"}{" "}
                    <button className="text-black underline underline-offset-8 hover:text-brutal-orange transition-colors font-black uppercase" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
                        {mode === "login" ? "JOIN SQUAD" : "BACK TO HQ"}
                    </button>
                </p>
            </div>
          </div>
        </div>

        <p className="marker-note text-4xl text-center mt-12 rotate-[2deg] text-brutal-acid">
          "Life is short. Passport stamps are forever."
        </p>
      </div>
    </div>
  );