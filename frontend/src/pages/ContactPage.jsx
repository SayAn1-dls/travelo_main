import React, { useState } from 'react';
import { toast } from 'sonner';
import { Linkedin, Send, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

const inputCls =
  'w-full border border-white/15 bg-zinc-950 px-4 py-4 font-mono text-sm text-white placeholder:text-white/30 outline-none transition focus:border-blaze';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await api.contact({ name: name.trim(), email: email.trim(), message: message.trim() });
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
      toast.success('Message sent. Sayan will get back to you!');
    } catch (err) {
      toast.error(err.message || 'Could not send your message. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink pt-16 text-white">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 py-16 md:px-8 lg:grid-cols-2 lg:gap-20 lg:py-24">
        {/* ============ LEFT: WHO ============ */}
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-blaze">// Say hello</p>
          <h1 className="mt-3 font-display text-6xl uppercase leading-[0.9] md:text-7xl">
            Talk to the <span className="text-outline-blaze">human.</span>
          </h1>
          <p className="mt-6 max-w-md font-mono text-sm leading-relaxed text-white/60">
            Questions, feedback, wild trip ideas or just want to say hi — drop a message.
            It lands straight in the inbox. No bots, no ticket numbers.
          </p>

          <div className="mt-12 border border-white/10 bg-zinc-950 p-8" data-testid="contact-person-card">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Built &amp; maintained by</p>
            <h2 className="mt-3 font-display text-4xl uppercase leading-none text-white" data-testid="contact-person-name">
              Sayan <span className="text-blaze">Bhattacharya</span>
            </h2>
            <p className="mt-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-white/50">
              <MapPin className="h-3.5 w-3.5 text-acid" /> Creator of TRAVELO
            </p>
            <a
              href="https://www.linkedin.com/in/sayanbhattacharya01/"
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-3 border border-white/20 px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:border-blaze hover:text-blaze"
              data-testid="contact-linkedin-link"
            >
              <Linkedin className="h-4 w-4" /> Connect on LinkedIn
            </a>
          </div>

          <p className="mt-8 font-marker text-xl text-acid">&ldquo;the best trips start with a conversation.&rdquo;</p>
        </div>

        {/* ============ RIGHT: FORM ============ */}
        <div>
          {sent ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center border border-blaze/40 bg-blaze/5 p-10 text-center" data-testid="contact-success-box">
              <CheckCircle2 className="h-14 w-14 text-blaze" />
              <h3 className="mt-6 font-display text-4xl uppercase text-white">Message sent.</h3>
              <p className="mt-3 max-w-sm font-mono text-sm text-white/60">
                Your message is on its way to Sayan&apos;s inbox. Expect a reply soon.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-8 border border-white/20 px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-white transition hover:border-blaze hover:text-blaze"
                data-testid="contact-send-another-btn"
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="border border-white/10 bg-zinc-950/60 p-8 md:p-10" data-testid="contact-form">
              <p className="font-mono text-xs uppercase tracking-[0.4em] text-white/40">// Drop a line</p>
              <div className="mt-8 space-y-4">
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  data-testid="contact-name-input"
                />
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                  data-testid="contact-email-input"
                />
                <textarea
                  required
                  minLength={5}
                  maxLength={2000}
                  rows={6}
                  placeholder="What's on your mind?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${inputCls} resize-none`}
                  data-testid="contact-message-input"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="group mt-6 flex w-full items-center justify-center gap-3 bg-blaze px-8 py-4 font-mono text-sm font-bold uppercase tracking-[0.2em] text-black transition hover:bg-blaze-hover disabled:opacity-50"
                data-testid="contact-submit-btn"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Send message
                    <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
