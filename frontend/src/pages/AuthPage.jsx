import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import QuoteRotator from '@/components/QuoteRotator';
import { ArrowRight, Loader2 } from 'lucide-react';

const SIDE_IMG = 'https://images.unsplash.com/photo-1518156959312-07a5380c1261?auto=format&fit=crop&w=1400&q=70';

export default function AuthPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const next = params.get('next') || '/explore';

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, navigate, next]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'register') {
        await register(form.name, form.email, form.password);
        toast.success('Welcome aboard. The world just got smaller.');
      } else {
        await login(form.email, form.password);
        toast.success('Back in the cockpit. Let\u2019s go.');
      }
      navigate(next, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full border border-white/15 bg-zinc-950 px-4 py-4 font-mono text-sm text-white placeholder:text-white/30 outline-none transition focus:border-blaze';

  return (
    <div className="flex min-h-screen bg-ink pt-16">
      {/* Left: cinematic panel */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <img src={SIDE_IMG} alt="Northern lights" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/40 via-transparent to-ink" />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <QuoteRotator compact />
        </div>
      </div>

      {/* Right: form */}
      <div className="flex w-full items-center justify-center px-5 py-16 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-blaze">// {mode === 'register' ? 'New recruit' : 'Welcome back'}</p>
          <h1 className="mt-3 font-display text-6xl uppercase leading-[0.9] text-white md:text-7xl">
            {mode === 'register' ? (
              <>Join the <span className="text-outline-blaze">chaos.</span></>
            ) : (
              <>Back for <span className="text-outline-blaze">more?</span></>
            )}
          </h1>

          <form onSubmit={submit} className="mt-10 space-y-4">
            {mode === 'register' && (
              <input
                required
                minLength={2}
                placeholder="FULL NAME"
                value={form.name}
                onChange={set('name')}
                className={inputCls}
                data-testid="auth-name-input"
              />
            )}
            <input
              required
              type="email"
              placeholder="EMAIL"
              value={form.email}
              onChange={set('email')}
              className={inputCls}
              data-testid="auth-email-input"
            />
            <input
              required
              type="password"
              minLength={6}
              placeholder="PASSWORD (6+ CHARS)"
              value={form.password}
              onChange={set('password')}
              className={inputCls}
              data-testid="auth-password-input"
            />
            <button
              type="submit"
              disabled={busy}
              className="group flex w-full items-center justify-center gap-3 bg-blaze px-8 py-4 font-mono text-sm font-bold uppercase tracking-[0.2em] text-black transition hover:bg-blaze-hover disabled:opacity-50"
              data-testid="auth-submit-btn"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  {mode === 'register' ? 'Create account' : 'Sign in'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
            className="mt-8 font-mono text-xs uppercase tracking-[0.25em] text-white/50 underline-offset-4 transition hover:text-acid hover:underline"
            data-testid="auth-toggle-mode"
          >
            {mode === 'register' ? 'Already have an account? Sign in' : 'No account? Join the chaos →'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
