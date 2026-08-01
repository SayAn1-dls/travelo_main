import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import { AirplaneTilt, ArrowRight, GoogleLogo, ShieldCheck } from "@phosphor-icons/react";
import { motion } from "framer-motion";

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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 selection:bg-brutal-orange selection:text-white">
      {/* FLOATING STICKER */}
      <div className="fixed top-20 right-20 w-32 h-32 bg-brutal-acid border-4 border-black flex items-center justify-center rotate-[15deg] shadow-2xl hidden md:flex">
        <span className="font-marker text-4xl text-black">NO<br/>BOTS</span>
      </div>

      <nav className="fixed top-10 left-10">
        <Link to="/" className="flex items-center gap-4 no-underline group">
          <div className="w-12 h-12 bg-brutal-orange border-4 border-white flex items-center justify-center rotate-[-10deg] group-hover:rotate-0 transition-transform">
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
          <p className="font-marker text-4xl text-brutal-orange italic">
            {mode === "login" ? '"Ready to ruin your bank balance?"' : '"Free passport. No stamps needed."'}
          </p>
        </header>

        <div className="border-4 border-white bg-white text-black relative overflow-hidden shadow-[12px_12px_0px_#FF4D00]">
          <div className="absolute top-0 left-0 right-0 h-4 bg-brutal-orange" />
          
          <div className="space-y-8 py-10 px-8">
            <button 
                onClick={() => { const r = window.location.origin + "/dashboard"; window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(r)}`; }}
                className="w-full bg-black text-white p-6 border-4 border-black flex items-center justify-center gap-6 hover:bg-brutal-grey transition-colors shadow-[8px_8px_0px_#FF4D00]"
            >
                <GoogleLogo size={32} weight="bold" />
                <span className="font-bebas text-3xl tracking-widest uppercase">BOARD WITH GOOGLE</span>
            </button>

            <div className="flex items-center gap-8">
                <div className="h-[3px] bg-black flex-1" />
                <span className="font-bebas text-2xl text-black opacity-30">OR</span>
                <div className="h-[3px] bg-black flex-1" />
            </div>

            <form onSubmit={submit} className="space-y-6">
              {mode === "register" && (
                <div className="space-y-2">
                  <label className="font-bebas text-2xl tracking-widest block">USER IDENTITY</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="SAYAN DLS" className="w-full border-4 border-black p-5 text-2xl font-black outline-none focus:border-brutal-orange bg-white" />
                </div>
              )}
              <div className="space-y-2">
                <label className="font-bebas text-2xl tracking-widest block">COMMS ADDRESS</label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="YOU@TRAVELO.APP" className="w-full border-4 border-black p-5 text-2xl font-black outline-none focus:border-brutal-orange bg-white" />
              </div>
              <div className="space-y-2">
                <label className="font-bebas text-2xl tracking-widest block">SECRET KEY</label>
                <input required type="password" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;" className="w-full border-4 border-black p-5 text-2xl font-black outline-none focus:border-brutal-orange bg-white" />
              </div>

              {error && (
                <div className="bg-red-500 text-white p-6 border-4 border-black font-black uppercase text-sm tracking-widest shadow-[8px_8px_0px_#000]">
                  &#9888;&#65039; BREACH DETECTED: {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-brutal-orange text-white border-4 border-black py-6 font-bebas text-4xl uppercase tracking-widest flex items-center justify-center gap-6 shadow-[8px_8px_0px_#000] hover:shadow-[12px_12px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-all active:translate-x-0 active:translate-y-0 active:shadow-none">
                {loading ? "CHECKING..." : mode === "login" ? "ENGAGE" : "REGISTER"}
                <ArrowRight size={44} weight="bold" />
              </button>
            </form>

            <div className="text-center pt-8 border-t-4 border-black/10">
                <p className="font-marker text-2xl rotate-[-1deg] text-black">
                    {mode === "login" ? "New around here? " : "Already built different? "}
                    <button className="text-brutal-orange underline underline-offset-8 hover:text-black transition-colors font-black uppercase" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
                        {mode === "login" ? "JOIN SQUAD" : "BACK TO HQ"}
                    </button>
                </p>
            </div>
          </div>
        </div>

        <p className="font-marker text-4xl text-center mt-12 rotate-[2deg] text-brutal-acid">
          "Life is short. Passport stamps are forever."
        </p>
      </div>
    </div>
  );
}
