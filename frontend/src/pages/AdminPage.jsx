import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Search, Mail, Trash2, Check, Circle } from 'lucide-react';
import api from '@/lib/api';

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');

const STATUS_STYLES = {
  confirmed: 'bg-acid text-black',
  pending_payment: 'bg-blaze text-black',
  cancelled: 'bg-white/10 text-white/60',
};
const STATUS_LABEL = { confirmed: 'Confirmed', pending_payment: 'Pending', cancelled: 'Cancelled' };
const TABS = ['Overview', 'Bookings', 'Users', 'Messages'];

const label = 'font-mono text-xs uppercase tracking-[0.2em]';

function StatusChip({ status }) {
  return (
    <span className={`inline-block px-2 py-0.5 ${label} font-bold ${STATUS_STYLES[status] || 'bg-white/10 text-white/60'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function Stat({ value, name, accent }) {
  return (
    <div className="bg-ink p-5 md:p-6">
      <div className={`font-display text-4xl md:text-5xl ${accent || 'text-white'}`}>{value}</div>
      <div className={`mt-1 ${label} text-white/60`}>{name}</div>
    </div>
  );
}

function Empty({ children }) {
  return <p className={`border border-white/10 py-14 text-center ${label} text-white/60`}>{children}</p>;
}

/* 14-day revenue bars, drawn as inline SVG so it has no extra dependency */
function DailyChart({ daily }) {
  const max = Math.max(1, ...daily.map((d) => d.revenue));
  const W = 700, H = 160, pad = 4;
  const bw = (W - pad * 2) / daily.length;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full" role="img" aria-label="Revenue over the last 14 days">
        {daily.map((d, i) => {
          const h = d.revenue ? Math.max(3, (d.revenue / max) * H) : 0;
          const x = pad + i * bw;
          return (
            <g key={d.date}>
              <rect x={x + 3} y={0} width={bw - 6} height={H} fill="rgba(255,255,255,0.04)" />
              {h > 0 && <rect x={x + 3} y={H - h} width={bw - 6} height={h} fill="#FF4500" />}
              <title>{`${d.date}: ${fmt(d.revenue)} · ${d.bookings} booking${d.bookings === 1 ? '' : 's'}`}</title>
              {(i % 2 === 0 || i === daily.length - 1) && (
                <text x={x + bw / 2} y={H + 16} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.6)" fontFamily="Space Mono, monospace">
                  {d.date.slice(8)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Overview({ stats }) {
  const t = stats.totals;
  const maxDest = Math.max(1, ...stats.top_destinations.map((d) => d.revenue));
  const totalStatus = Math.max(1, t.bookings);
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-px bg-white/10 md:grid-cols-3 lg:grid-cols-6">
        <Stat value={fmt(t.revenue)} name="Revenue" accent="text-acid" />
        <Stat value={fmt(t.pending_value)} name="Pending" accent="text-blaze" />
        <Stat value={t.bookings} name="Bookings" />
        <Stat value={t.users} name="Users" />
        <Stat value={t.trips} name="Trip plans" />
        <Stat value={t.unread_messages} name="Unread" accent={t.unread_messages ? 'text-blaze' : 'text-white'} />
      </div>

      <div className="grid gap-10 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h3 className="font-display text-3xl uppercase">Revenue · last 14 days</h3>
          <div className="mt-4 border border-white/10 bg-zinc-950 p-4"><DailyChart daily={stats.daily} /></div>
        </section>

        <section className="lg:col-span-2">
          <h3 className="font-display text-3xl uppercase">Booking status</h3>
          <div className="mt-4 space-y-4 border border-white/10 bg-zinc-950 p-5">
            {Object.entries(stats.by_status).map(([k, v]) => (
              <div key={k}>
                <div className={`flex justify-between ${label} text-white/70`}><span>{STATUS_LABEL[k]}</span><span>{v}</span></div>
                <div className="mt-1.5 h-2 bg-white/10">
                  <div className={`h-2 ${k === 'confirmed' ? 'bg-acid' : k === 'pending_payment' ? 'bg-blaze' : 'bg-white/40'}`} style={{ width: `${(v / totalStatus) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="dashed-divider" />
            <div className={`flex justify-between ${label} text-white/70`}>
              <span>Paid by tier</span>
              <span>{Object.entries(stats.by_tier).map(([k, v]) => `${k[0].toUpperCase()}${k.slice(1, 3)} ${v}`).join(' · ')}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h3 className="font-display text-3xl uppercase">Top destinations</h3>
          <div className="mt-4 space-y-3 border border-white/10 bg-zinc-950 p-5">
            {stats.top_destinations.length ? stats.top_destinations.map((d) => (
              <div key={d.name}>
                <div className="flex justify-between text-sm"><span>{d.name}</span><span className="text-white/70">{fmt(d.revenue)} · {d.bookings}</span></div>
                <div className="mt-1 h-1.5 bg-white/10"><div className="h-1.5 bg-acid" style={{ width: `${(d.revenue / maxDest) * 100}%` }} /></div>
              </div>
            )) : <p className={`${label} text-white/60`}>No paid bookings yet</p>}
          </div>
        </section>

        <section>
          <h3 className="font-display text-3xl uppercase">Latest bookings</h3>
          <ul className="mt-4 divide-y divide-white/10 border border-white/10 bg-zinc-950">
            {stats.recent_bookings.length ? stats.recent_bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">{b.destination_name} · {b.travelers} pax</p>
                  <p className={`${label} text-white/60`}>{fmtDate(b.created_at)} · {fmt(b.amount)}</p>
                </div>
                <StatusChip status={b.status} />
              </li>
            )) : <li className={`px-5 py-8 text-center ${label} text-white/60`}>No bookings yet</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Bookings({ onChanged }) {
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    api.adminBookings(status).then(setRows).catch((e) => { toast.error(e.message); setRows([]); });
  }, [status]);
  useEffect(() => { setRows(null); load(); }, [load]);

  const change = async (id, next) => {
    try {
      await api.adminSetBookingStatus(id, next);
      toast.success(`Marked ${STATUS_LABEL[next].toLowerCase()}`);
      load();
      onChanged();
    } catch (e) { toast.error(e.message); }
  };

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows || [];
    return (rows || []).filter((b) => [b.destination_name, b.user_name, b.user_email, b.id].some((v) => (v || '').toLowerCase().includes(s)));
  }, [rows, q]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {[['', 'All'], ['confirmed', 'Confirmed'], ['pending_payment', 'Pending'], ['cancelled', 'Cancelled']].map(([k, l]) => (
          <button key={k} onClick={() => setStatus(k)}
            className={`border px-4 py-2 ${label} transition ${status === k ? 'border-blaze bg-blaze text-black' : 'border-white/15 text-white/70 hover:border-white/40 hover:text-white'}`}>
            {l}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="SEARCH…"
            className="w-full border border-white/15 bg-zinc-950 py-2.5 pl-10 pr-4 font-mono text-xs uppercase tracking-widest text-white outline-none placeholder:text-white/50 focus:border-acid" />
        </div>
      </div>

      {rows === null ? <Loader2 className="mx-auto mt-16 h-6 w-6 animate-spin text-blaze" /> : !shown.length ? (
        <div className="mt-6"><Empty>No bookings found</Empty></div>
      ) : (
        <div className="mt-6 overflow-x-auto border border-white/10">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className={`bg-zinc-950 ${label} text-white/60`}>
              <tr>{['Trip', 'Customer', 'Dates', 'Tier', 'Amount', 'Status', 'Set status'].map((h) => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {shown.map((b) => (
                <tr key={b.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3"><div>{b.destination_name}</div><div className="text-xs text-white/60">{b.country} · {b.travelers} pax</div></td>
                  <td className="px-4 py-3"><div>{b.user_name}</div><div className="text-xs text-white/60">{b.user_email}</div></td>
                  <td className="px-4 py-3 text-white/70">{fmtDate(b.start_date)} → {fmtDate(b.end_date)}</td>
                  <td className={`px-4 py-3 ${label} text-white/70`}>{b.tier}</td>
                  <td className="px-4 py-3 font-bold">{fmt(b.amount)}</td>
                  <td className="px-4 py-3"><StatusChip status={b.status} /></td>
                  <td className="px-4 py-3">
                    <select value={b.status} onChange={(e) => change(b.id, e.target.value)}
                      className={`border border-white/20 bg-ink px-2 py-1.5 ${label} text-white outline-none focus:border-acid`}>
                      {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Users() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => { api.adminUsers().then(setRows).catch((e) => { toast.error(e.message); setRows([]); }); }, []);
  const shown = (rows || []).filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div>
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="SEARCH…"
          className="w-full border border-white/15 bg-zinc-950 py-2.5 pl-10 pr-4 font-mono text-xs uppercase tracking-widest text-white outline-none placeholder:text-white/50 focus:border-acid" />
      </div>
      {rows === null ? <Loader2 className="mx-auto mt-16 h-6 w-6 animate-spin text-blaze" /> : !shown.length ? (
        <div className="mt-6"><Empty>No users found</Empty></div>
      ) : (
        <div className="mt-6 overflow-x-auto border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={`bg-zinc-950 ${label} text-white/60`}>
              <tr>{['Name', 'Email', 'Joined', 'Bookings', 'Spent'].map((h) => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {shown.map((u) => (
                <tr key={u.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3">{u.name} {u.is_admin && <span className={`ml-2 bg-acid px-1.5 py-0.5 ${label} font-bold text-black`}>Admin</span>}</td>
                  <td className="px-4 py-3 text-white/70">{u.email}</td>
                  <td className="px-4 py-3 text-white/70">{fmtDate(u.created_at)}</td>
                  <td className="px-4 py-3">{u.bookings}</td>
                  <td className="px-4 py-3 font-bold">{fmt(u.spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Messages({ onChanged }) {
  const [rows, setRows] = useState(null);
  const load = useCallback(() => { api.adminMessages().then(setRows).catch((e) => { toast.error(e.message); setRows([]); }); }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (m) => {
    try { await api.adminMarkMessage(m.id, !m.read); load(); onChanged(); } catch (e) { toast.error(e.message); }
  };
  const remove = async (m) => {
    if (!window.confirm(`Delete the message from ${m.name}? This can't be undone.`)) return;
    try { await api.adminDeleteMessage(m.id); toast.success('Message deleted'); load(); onChanged(); } catch (e) { toast.error(e.message); }
  };

  if (rows === null) return <Loader2 className="mx-auto mt-16 h-6 w-6 animate-spin text-blaze" />;
  if (!rows.length) return <Empty>Inbox zero. Nobody's written in yet.</Empty>;
  return (
    <ul className="space-y-3">
      {rows.map((m) => (
        <li key={m.id} className={`border p-5 ${m.read ? 'border-white/10 bg-zinc-950' : 'border-blaze/60 bg-blaze/[0.04]'}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-bold">
                {!m.read && <Circle className="h-2.5 w-2.5 fill-blaze text-blaze" />} {m.name}
              </p>
              <p className="text-sm text-white/60">{m.email} · {fmtDateTime(m.created_at)}</p>
            </div>
            <div className="flex gap-2">
              <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to Travelo')}`}
                className={`flex items-center gap-1.5 border border-acid/60 px-3 py-1.5 ${label} text-acid transition hover:bg-acid hover:text-black`}>
                <Mail className="h-3.5 w-3.5" /> Reply
              </a>
              <button onClick={() => toggle(m)} className={`flex items-center gap-1.5 border border-white/20 px-3 py-1.5 ${label} text-white/80 transition hover:border-white/50`}>
                <Check className="h-3.5 w-3.5" /> {m.read ? 'Mark unread' : 'Mark read'}
              </button>
              <button onClick={() => remove(m)} aria-label="Delete message" className="border border-white/20 px-2.5 py-1.5 text-white/60 transition hover:border-blaze hover:text-blaze">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-3 max-w-3xl whitespace-pre-wrap leading-relaxed text-white/80">{m.message}</p>
        </li>
      ))}
    </ul>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const loadStats = useCallback(() => {
    setError('');
    api.adminStats().then(setStats).catch((e) => setError(e.message || 'Could not load stats'));
  }, []);
  useEffect(() => { loadStats(); }, [loadStats]);

  const unread = stats?.totals.unread_messages || 0;

  return (
    <div className="min-h-screen bg-ink pt-16 text-white" data-testid="admin-page">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={`${label} text-acid`}>// Control room</p>
            <h1 className="mt-3 font-display text-[clamp(3rem,8vw,6rem)] uppercase leading-[0.85]">
              Admin <span className="text-outline-blaze">panel.</span>
            </h1>
          </div>
          <button onClick={loadStats} className={`flex items-center gap-2 border border-white/20 px-4 py-2 ${label} text-white/80 transition hover:border-acid hover:text-acid`}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="mt-10 flex gap-1 overflow-x-auto border-b border-white/10">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} data-testid={`admin-tab-${t.toLowerCase()}`}
              className={`-mb-px whitespace-nowrap border-b-2 px-5 py-3 ${label} transition ${tab === t ? 'border-blaze text-white' : 'border-transparent text-white/60 hover:text-white'}`}>
              {t}{t === 'Messages' && unread > 0 && <span className="ml-2 bg-blaze px-1.5 py-0.5 font-bold text-black">{unread}</span>}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === 'Overview' && (error ? <Empty>{error}</Empty> : stats ? <Overview stats={stats} /> : <Loader2 className="mx-auto mt-16 h-6 w-6 animate-spin text-blaze" />)}
          {tab === 'Bookings' && <Bookings onChanged={loadStats} />}
          {tab === 'Users' && <Users />}
          {tab === 'Messages' && <Messages onChanged={loadStats} />}
        </div>
      </div>
    </div>
  );
}
