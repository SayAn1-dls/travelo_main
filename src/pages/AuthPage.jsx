import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, AirplaneTilt, ShieldCheck } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success("AUTHENTICATION CLEARED.");
      } else {
        await register(form.name, form.email, form.password);
        toast.success("OPERATIVE ACCOUNT CREATED.");
      }
      navigate("/dashboard");
    } catch (err) {
      toast.error("BYPASSING TO DEMO MODE.");
      login('demo@travelo.app', 'demo');
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 relative overflow-hidden">
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(255,77,0,0.08),transparent)]" />
       
       <div className="w-full max-w-xl relative z-10">
          <div className="text-center mb-16">
             <div className="w-16 h-16 bg-orange-500 rounded-2xl mx-auto flex items-center justify-center mb-12 shadow-[0_0_40px_rgba(255,77,0,0.3)]">
                <AirplaneTilt size={36} weight="fill" className="text-white" />
             </div>
             <h1 className="header-massive text-white leading-none">COMMAND <br/><span className="text-orange-500 italic">ACCESS.</span></h1>
             <p className="text-white/20 font-black text-xs tracking-[0.5em] mt-12 uppercase italic">v4.2 MASTERPIECE — BESTEST UI</p>
          </div>

          <div className="silicon-glass border-white/5">
             <div className="flex gap-2 mb-12 bg-white/[0.03] border border-white/5 p-2 rounded-2xl">
                {['login', 'signup'].map(m => (
                  <button key={m} onClick={() => setMode(m)} className={`flex-1 py-6 rounded-xl font-black text-[10px] tracking-[0.4em] transition-all ${mode === m ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(255,77,0,0.3)]' : 'text-white/30 hover:text-white'}`}>
                    {m.toUpperCase()}
                  </button>
                ))}
             </div>

             <form onSubmit={handleSubmit} className="space-y-8">
                {mode === 'signup' && (
                  <div className="space-y-3">
                    <label className="silicon-label">CODENAME</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="SAYAN" className="silicon-input" />
                  </div>
                )}
                <div className="space-y-3">
                  <label className="silicon-label">IDENTIFIER</label>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="SAYAN@TRAVELO.APP" className="silicon-input" />
                </div>
                <div className="space-y-3">
                  <label className="silicon-label">SECRET KEY</label>
                  <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" className="silicon-input" />
                </div>
                <button type="submit" disabled={loading} className="w-full btn-launch group py-10">
                  {loading ? 'SYNCING...' : <span className="flex items-center gap-4 uppercase tracking-[0.3em]">ENGAGE COMMAND <ArrowRight size={32} weight="bold" className="group-hover:translate-x-2 transition-transform" /></span>}
                </button>
             </form>

             <div className="mt-12 text-center border-t border-white/5 pt-8">
                <button onClick={() => { login('demo@travelo.app', 'demo'); navigate('/dashboard'); }} className="text-white/20 font-bold text-sm uppercase tracking-widest hover:text-orange-500 transition-all italic underline underline-offset-8 decoration-white/10">
                  Skip — Enter as Demo Operative
                </button>
             </div>

             <div className="mt-12 flex items-center justify-center gap-3 opacity-20">
                <ShieldCheck size={20} />
                <p className="text-[10px] font-black uppercase tracking-widest">ENCRYPTED GATEWAY</p>
             </div>
          </div>
       </div>
    </div>
  );
}