import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, CheckCircle, Lock } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function PaymentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ name: '', card: '', expiry: '', cvv: '', amount: '' });
  const [loading, setLoading] = useState(false);

  // Credit card formatters — auto-spaces and expiry slashes
  const formatCard = (val) => val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    return clean.length > 2 ? `${clean.slice(0,2)}/${clean.slice(2)}` : clean;
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (!form.name || !form.card || !form.expiry || !form.cvv || !form.amount) {
      return toast.error("ALL FIELDS REQUIRED, OPERATIVE.");
    }
    setLoading(true);
    const payments = JSON.parse(localStorage.getItem('travelo_payments') || '[]');
    const payment = {
      id: Date.now().toString(),
      amount: parseFloat(form.amount),
      cardLast4: form.card.replace(/\s/g, '').slice(-4),
      name: form.name.toUpperCase(),
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'PAID',
    };
    payments.push(payment);
    localStorage.setItem('travelo_payments', JSON.stringify(payments));
    
    setTimeout(() => {
      setLoading(false);
      setStep('success');
      toast.success("💳 PAYMENT LOCKED IN. YOU'RE SET.");
    }, 1800);
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center px-6 py-20">
        <div className="max-w-xl w-full text-center">
          <div className="silicon-glass border-cyan-500/20 flex flex-col items-center gap-10">
            <CheckCircle size={100} weight="duotone" className="text-cyan-500 animate-pulse" />
            <h1 className="text-[10vw] md:text-[6vw] font-[900] font-bebas uppercase text-white italic leading-none">
              PAYMENT <span className="text-cyan-500">CLEARED!</span>
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-widest text-xl italic">
              \"MONEY MOVED. DEBT CLEARED. VIBES SECURED.\"
            </p>
            <p className="text-white/20 font-bold text-sm uppercase tracking-widest">
              ₹{parseFloat(form.amount).toLocaleString()} — Transaction complete
            </p>
            <div className="flex gap-6 w-full">
              <button onClick={() => navigate('/dashboard')} className="flex-1 btn-launch py-8 text-2xl">
                BACK TO HQ
              </button>
              <button onClick={() => { setStep('form'); setForm({ name: '', card: '', expiry: '', cvv: '', amount: '' }); }} 
                className="flex-1 bg-white/5 border border-white/10 py-8 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-white/10 transition-all text-white/40">
                PAY AGAIN
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] pt-36 pb-20 px-6 md:px-10 relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(at_50%_0%,rgba(0,240,255,0.04)_0%,transparent_60%)] pointer-events-none" />
      <div className="max-w-2xl mx-auto relative z-10">
        <header className="mb-16">
          <p className="text-[11px] font-black tracking-[0.5em] uppercase text-orange-500/60 mb-6 italic">Secure Checkout</p>
          <h1 className="text-[12vw] md:text-[7vw] font-[900] leading-[0.78] uppercase font-bebas text-white">
            PAY THE <span className="text-orange-500 italic">TOLL.</span>
          </h1>
          <p className="text-white/30 font-bold text-xl mt-6 italic uppercase tracking-widest">
            \"SETTLE YOUR DEBT. TRAVEL WITH A CLEAR CONSCIENCE.\"
          </p>
        </header>

        <div className="silicon-glass border-white/10">
          <div className="flex items-center gap-4 mb-12 p-6 bg-white/[0.03] border border-white/5 rounded-2xl">
            <Lock size={24} className="text-cyan-500" />
            <span className="font-black text-sm uppercase tracking-widest text-white/40">256-bit encrypted · Local demo mode</span>
          </div>

          <form onSubmit={handlePay} className="space-y-8">
            <div className="space-y-3">
              <label className="silicon-label">Cardholder Name *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                placeholder="SAYAN OPERATIVE"
                className="silicon-input"
              />
            </div>

            <div className="space-y-3">
              <label className="silicon-label">Card Number *</label>
              <div className="relative">
                <input
                  required
                  value={form.card}
                  onChange={e => setForm({...form, card: formatCard(e.target.value)})}
                  placeholder="4242 4242 4242 4242"
                  className="silicon-input pr-20"
                  maxLength={19}
                />
                <CreditCard size={32} className="absolute right-8 top-1/2 -translate-y-1/2 text-white/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="silicon-label">Expiry *</label>
                <input
                  required
                  value={form.expiry}
                  onChange={e => setForm({...form, expiry: formatExpiry(e.target.value)})}
                  placeholder="MM/YY"
                  className="silicon-input"
                  maxLength={5}
                />
              </div>
              <div className="space-y-3">
                <label className="silicon-label">CVV *</label>
                <input
                  required
                  type="password"
                  value={form.cvv}
                  onChange={e => setForm({...form, cvv: e.target.value.slice(0, 4)})}
                  placeholder="•••"
                  className="silicon-input"
                  maxLength={4}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="silicon-label">Amount (₹) *</label>
              <input
                required
                type="number"
                value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})}
                placeholder="5000"
                className="silicon-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-launch py-10 text-3xl rounded-[2rem] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-4">
                  <span className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  PROCESSING...
                </span>
              ) : (
                <>PAY NOW — {form.amount ? `₹${parseFloat(form.amount).toLocaleString()}` : '₹0'}</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );