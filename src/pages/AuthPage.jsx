import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AirplaneTilt, Eye, EyeSlash, Spinner, GoogleLogo, EnvelopeSimple, Lock, User } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, loginWithGoogle, authError, clearError, firebaseEnabled } = useAuth();

  const [mode, setMode] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleChange = (e) => { clearError(); setForm(f => ({ ...f, [e.target.name]: e.target.value })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error("All fields required, operative."); return; }
    setLoading(true);
    try {
      if (mode === "login") { await login(form.email, form.password); toast.success("MISSION STARTED. WELCOME BACK."); }
      else { if (!form.name) { toast.error("Enter your operative name."); setLoading(false); return; } await register(form.name, form.email, form.password); toast.success("OPERATIVE REGISTERED. MISSION HQ UNLOCKED."); }
      navigate("/dashboard");
    } catch (err) { toast.error(err.message || "Auth failed. Try again."); } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try { await loginWithGoogle(); toast.success("GOOGLE SIGN-IN COMPLETE."); navigate("/dashboard"); }
    catch (err) { toast.error(err.message || "Google sign-in failed."); } finally { setGoogleLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,77,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,77,0,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />
      <div className="relative z-10 w-full max-w-md">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-3 mb-12">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center">
            <AirplaneTilt size={24} weight="fill" className="text-white" />
          </div>
          <span className="font-bebas text-4xl uppercase">travelo.</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="silicon-glass">
          <div className="flex gap-2 p-1.5 bg-white/[0.03] border border-white/8 rounded-2xl mb-10">
            {["login", "register"].map((m) => (
              <button key={m} onClick={() => { setMode(m); clearError(); }} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-[0.3em] transition-all ${mode === m ? "bg-orange-500 text-white" : "text-white/25 hover:text-white/50"}`}>
                {m === "login" ? "SIGN IN" : "JOIN NOW"}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.form key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} onSubmit={handleSubmit} className="space-y-5">
              {mode === "register" && (
                <div><label className="silicon-label">OPERATIVE NAME</label><div className="relative"><User size={20} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" /><input name="name" value={form.name} onChange={handleChange} className="silicon-input pl-12" placeholder="YOUR NAME" /></div></div>
              )}
              <div><label className="silicon-label">EMAIL</label><div className="relative"><EnvelopeSimple size={20} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" /><input name="email" type="email" value={form.email} onChange={handleChange} className="silicon-input pl-12" placeholder="EMAIL ADDRESS" /></div></div>
              <div><label className="silicon-label">PASSWORD</label><div className="relative"><Lock size={20} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" /><input name="password" type={showPass ? "text" : "password"} value={form.password} onChange={handleChange} className="silicon-input pl-12 pr-14" placeholder="PASSWORD" minLength={6} /><button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">{showPass ? <EyeSlash size={20} weight="bold" /> : <Eye size={20} weight="bold" />}</button></div></div>
              {authError && <p className="text-red-400 text-xs font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">⚠ {authError}</p>}
              <button type="submit" disabled={loading} className="btn-launch w-full mt-2">{loading ? "INITIATING..." : mode === "login" ? "ENTER MISSION HQ" : "REGISTER OPERATIVE"}</button>
            </motion.form>
          </AnimatePresence>
          <div className="flex items-center gap-4 my-8"><div className="flex-1 h-px bg-white/8" /><span className="text-white/15 text-[10px] font-black uppercase tracking-widest">OR</span><div className="flex-1 h-px bg-white/8" /></div>
          <button onClick={handleGoogle} disabled={googleLoading} className="w-full flex items-center justify-center gap-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/8 rounded-2xl py-5 text-sm font-black uppercase tracking-widest text-white/50 hover:text-white transition-all">
            <GoogleLogo size={20} weight="bold" />
            CONTINUE WITH GOOGLE
          </button>
        </motion.div>
      </div>
    </div>
  );
}
