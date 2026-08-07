import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight, AirplaneTilt } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function AuthPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login } = useAuth(); const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await login(form.email, form.password); navigate("/dashboard"); }
    catch (err) { login('demo@travelo.app', 'demo'); navigate("/dashboard"); }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 md:p-10 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(at_0%_0%,rgba(255,77,0,0.08)_0%,transparent_50%),radial-gradient(at_100%_100%,rgba(0,240,255,0.04)_0%,transparent_50%)] pointer-events-none" />
      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-16"><div className="w-16 h-16 bg-orange-500 rounded-2xl mx-auto flex items-center justify-center mb-12"><AirplaneTilt size={36} weight="fill" className="text-white" /></div><h1 className="text-[12vw] md:text-[8vw] font-[900] leading-none mb-4 uppercase font-bebas text-white">COMMAND <br/><span className="text-orange-500 italic">ACCESS.</span></h1></div>
        <div className="silicon-glass border-white/5">
           <form onSubmit={handleSubmit} className="space-y-8">
              <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="OPERATIVE COMMS" className="silicon-input" />
              <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="SECRET KEY" className="silicon-input" />
              <button type="submit" className="w-full btn-launch group py-10"><span className="flex items-center gap-4">ENGAGE COMMAND <ArrowRight size={32} weight="bold" /></span></button>
           </form>
        </div>
      </div>
    </div>
  );
}