import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight } from "@phosphor-icons/react";

export default function AuthPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    login(form.email, form.password);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-10 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(at_0%_0%,rgba(255,77,0,0.1)_0%,transparent_50%),radial-gradient(at_100%_100%,rgba(0,240,255,0.03)_0%,transparent_50%)] pointer-events-none" />
      
      <div className="w-full max-w-xl relative z-10">
        <header className="text-center mb-16">
          <h1 className="text-[12vw] font-[900] leading-none mb-4 uppercase font-bebas text-white">READY TO <br/><span className="text-orange-500 italic">LAUNCH?</span></h1>
          <p className="text-white/40 font-bold uppercase tracking-widest text-sm italic mt-8">"DON'T BE THE ONE WHO STAYED HOME."</p>
        </header>

        <div className="silicon-glass">
          <form onSubmit={handleLogin} className="space-y-12">
            <div className="space-y-4">
              <label className="text-[12px] font-black uppercase tracking-[0.5em] text-white/20 ml-4">Operative Comms</label>
              <input
                required
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                placeholder="SAYAN@TRAVELO.APP"
                className="silicon-input"
              />
            </div>
            
            <div className="space-y-4">
              <label className="text-[12px] font-black uppercase tracking-[0.5em] text-white/20 ml-4">Secret Key</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="••••••••"
                className="silicon-input"
              />
            </div>

            <button type="submit" className="w-full btn-launch py-10 text-4xl">
              ENGAGE COMMAND <ArrowRight size={48} weight="bold" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
