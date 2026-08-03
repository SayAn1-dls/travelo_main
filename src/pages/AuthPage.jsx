import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, AirplaneTilt } from "@phosphor-icons/react";
import { toast } from "sonner";
const QUOTES = [ '"DON\'T BE THE ONE WHO STAYED HOME."', '"THE GROUP CHAT IS WAITING. LOG IN."', '"YOUR PASSPORT IS BORED. FIX THAT."', '"ADVENTURES DON\'T BOOK THEMSELVES."' ];
export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (mode === 'login') { await login(form.email, form.password); toast.success("OPERATIVE AUTHENTICATED. WELCOME BACK."); }
      else { if (!form.name) return toast.error("NAME REQUIRED."); await register(form.name); toast.success("OPERATIVE CREATED. LET'S GO."); }
      navigate("/dashboard");
    } catch (err) { toast.error("AUTH FAILED. TRY AGAIN."); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-xl relative z-10">
        <div className="flex items-center justify-center gap-4 mb-16">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center"><AirplaneTilt size={28} weight="fill" className="text-white" /></div>
          <span className="text-5xl font-[900] font-bebas uppercase text-white">TRAVELO.</span>
        </div>
        <header className="text-center mb-16">
          <h1 className="text-[12vw] md:text-[8vw] font-[900] leading-none mb-4 uppercase font-bebas text-white">{mode === 'login' ? 'WELCOME' : 'JOIN THE'}<br/><span className="text-orange-500 italic">{mode === 'login' ? 'BACK.' : 'SQUAD.'}</span></h1>
          <p className="text-white/30 font-bold uppercase tracking-widest text-sm italic mt-8">{quote}</p>
        </header>
        <div className="silicon-glass">
          <form onSubmit={handleSubmit} className="space-y-8">
            {mode === 'signup' && (<div className="space-y-3"><label className="silicon-label">Operative Name</label><input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="SAYAN" className="silicon-input" /></div>)}
            <div className="space-y-3"><label className="silicon-label">Email</label><input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="SAYAN@TRATELM.APP" className="silicon-input" /></div>
            <div className="space-y-3"><label className="silicon-label">Password</label><input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" className="silicon-input" /></div>
            <button type="submit" disabled={loading} className="w-full btn-launch py-10 text-3xl rounded-[2rem]">{mode === 'login' ? 'ENTER HQ' : 'JOIN SQUAD'} <ArrowRight size={40} weight="bold" /></button>
          </form>
          <div className="mt-12 text-center"><button onClick={() => { login('demo@travelo.app', 'demo'); navigate('/dashboard'); }} className="text-white/20 font-bold text-sm uppercase tracking-widest hover:text-orange-500 transition-colors italic underline">Skip — Enter as Demo Operative</button></div>
        </div>
      </div>
    </div>
  );
}
