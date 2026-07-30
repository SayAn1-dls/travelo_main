import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api, { formatApiError, money, csym, CURRENCIES } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UsersThree, Plus, SignIn, Trash, Archive, CaretDown, ChatsCircle, AirplaneTilt } from "@phosphor-icons/react";
import { toast } from "sonner";

const CATEGORIES = ["stay", "food", "transport", "activities"];
const today = new Date().toISOString().split("T")[0];

function CreateTripDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", destination: "", start_date: today, end_date: today, budget_total: "", currency: "INR" });
  const [catBudget, setCatBudget] = useState({});
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name || !form.destination) return toast.error("Trip name and destination are required");
    setSaving(true);
    try {
      const { data } = await api.post("/trips", {
        ...form,
        budget_total: Number(form.budget_total) || 0,
        budget_categories: Object.fromEntries(Object.entries(catBudget).map(([k, v]) => [k, Number(v) || 0])),
        members: members.filter((m) => m.email.trim()).map(({ _key, ...m }) => m),
      });
      toast.success("Trip created");
      setOpen(false);
      onCreated(data);
    } catch (e) {
      toast.error(formatApiError(e));
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="create-trip-btn" className="rounded-full bg-[#FF5A36] hover:bg-[#E64322] h-11 px-6">
          <Plus size={18} className="mr-1.5" /> New travel plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" data-testid="create-trip-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Create a travel plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Trip name</Label>
            <Input data-testid="trip-name-input" placeholder="Goa New Year Squad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Destination</Label>
            <Input data-testid="trip-destination-input" placeholder="Goa" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input data-testid="trip-start-input" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input data-testid="trip-end-input" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger data-testid="trip-currency-select" className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CURRENCIES).map(([code, s]) => (
                    <SelectItem key={code} value={code} data-testid={`currency-option-${code}`}>{code} — {s.trim()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Total budget ({csym(form.currency).trim()})</Label>
              <Input data-testid="trip-budget-input" type="number" min="0" placeholder="40000" value={form.budget_total} onChange={(e) => setForm({ ...form, budget_total: e.target.value })} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Budget by category (optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <Input key={c} data-testid={`trip-budget-${c}`} type="number" min="0" placeholder={`${c} ${csym(form.currency).trim()}`} value={catBudget[c] || ""} onChange={(e) => setCatBudget({ ...catBudget, [c]: e.target.value })} className="rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Group members (by email)</Label>
              <Button data-testid="add-member-row-btn" size="sm" variant="outline" className="rounded-full h-7" onClick={() => setMembers([...members, { _key: crypto.randomUUID(), name: "", email: "" }])}>+ Add</Button>
            </div>
            {members.map((m, i) => (
              <div key={m._key} className="flex gap-2">
                <Input data-testid={`member-name-${i}`} placeholder="Name" value={m.name} onChange={(e) => setMembers(members.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className="rounded-xl" />
                <Input data-testid={`member-email-${i}`} placeholder="email@example.com" value={m.email} onChange={(e) => setMembers(members.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} className="rounded-xl" />
                <Button size="icon" variant="ghost" onClick={() => setMembers(members.filter((_, j) => j !== i))}><Trash size={16} /></Button>
              </div>
            ))}
          </div>
          <Button data-testid="trip-submit-btn" onClick={submit} disabled={saving} className="w-full rounded-full bg-[#FF5A36] hover:bg-[#E64322] h-11">
            {saving ? "Creating…" : "Create trip"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const tripCountdown = (t) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const s = new Date(`${t.start_date}T00:00:00`);
  const e = new Date(`${t.end_date}T00:00:00`);
  if (now < s) {
    const d = Math.round((s - now) / 86400000);
    return { label: d === 1 ? "Tomorrow!" : `${d} days to go`, kind: "upcoming" };
  }
  if (now <= e) return { label: "On trip now", kind: "live" };
  return null;
};

function TripCard({ trip: t, index: i }) {
  const cd = tripCountdown(t);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
      <Link to={`/trips/${t.id}`} data-testid="trip-card" className="block bg-white border border-[#E5E4E0] rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-[box-shadow,transform] duration-300">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-xl font-bold">{t.name}</h3>
          <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
            {cd && !t.archived && (
              <Badge data-testid="trip-countdown-badge" className={`border-0 gap-1 ${cd.kind === "live" ? "bg-emerald-600 text-white" : "bg-[#0A2540] text-white"}`}>
                <AirplaneTilt size={12} weight="fill" /> {cd.label}
              </Badge>
            )}
            {t.unread_chat > 0 && (
              <Badge data-testid="trip-chat-unread-badge" className="bg-[#FF5A36] text-white border-0 gap-1">
                <ChatsCircle size={12} weight="fill" /> {t.unread_chat} new
              </Badge>
            )}
            <Badge variant="outline" className="border-[#0A2540] text-[#0A2540]">{t.members.length} members</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{t.destination} · {t.start_date} → {t.end_date}</p>
        <div className="flex items-center gap-2 mt-4">
          <div className="flex -space-x-2">
            {t.members.slice(0, 4).map((m) => (
              <div key={m.member_id} className="h-8 w-8 rounded-full bg-[#EAE7E0] border-2 border-white flex items-center justify-center text-xs font-bold text-[#1A1A1A]">
                {m.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-sm font-bold ml-auto">{money(t.budget_total, t.currency)} budget</span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function TripsPage() {
  const [trips, setTrips] = useState(null);
  const [code, setCode] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const navigate = useNavigate();

  const load = () => api.get("/trips").then((r) => setTrips(r.data)).catch(() => setTrips([]));
  useEffect(() => { load(); }, []);

  const join = async () => {
    if (!code.trim()) return;
    try {
      const { data } = await api.post("/trips/join", { code: code.trim() });
      toast.success("Joined trip!");
      navigate(`/trips/${data.trip_id}`);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div>
          <p className="uppercase tracking-[0.25em] text-xs font-semibold text-[#FF5A36] mb-2">Group travel planner</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Your trips</h1>
        </div>
        <CreateTripDialog onCreated={(t) => navigate(`/trips/${t.id}`)} />
      </div>

      <div className="mt-8 bg-white border border-[#E5E4E0] rounded-2xl p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
        <p className="text-sm font-medium flex items-center gap-2"><SignIn size={18} className="text-[#0A2540]" /> Got an invite code?</p>
        <div className="flex gap-2 flex-1 sm:max-w-sm">
          <Input data-testid="join-code-input" placeholder="e.g. xY3kPq_z" value={code} onChange={(e) => setCode(e.target.value)} className="rounded-xl" />
          <Button data-testid="join-trip-btn" onClick={join} variant="outline" className="rounded-full">Join</Button>
        </div>
      </div>

      {trips === null ? (
        <p className="mt-10 text-muted-foreground">Loading…</p>
      ) : trips.length === 0 ? (
        <div className="mt-10 bg-[#0A2540] text-white rounded-2xl p-12 text-center relative overflow-hidden grain">
          <UsersThree size={40} weight="duotone" className="text-[#FFB49B] mx-auto" />
          <p className="font-display text-2xl font-bold mt-4">No trips yet</p>
          <p className="text-white/75 mt-2 max-w-md mx-auto text-sm">Create a travel plan, invite your crew, set a budget and let Travelo handle the money math.</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-5 mt-10">
            {trips.filter((t) => !t.archived).map((t, i) => <TripCard key={t.id} trip={t} index={i} />)}
          </div>
          {trips.filter((t) => t.archived).length > 0 && (
            <div className="mt-12">
              <button
                data-testid="toggle-archived-btn"
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <Archive size={17} weight="duotone" />
                Archived trips ({trips.filter((t) => t.archived).length})
                <CaretDown size={14} className={`transition-transform duration-200 ${showArchived ? "rotate-180" : ""}`} />
              </button>
              {showArchived && (
                <div className="grid sm:grid-cols-2 gap-5 mt-4 opacity-75" data-testid="archived-trips-section">
                  {trips.filter((t) => t.archived).map((t, i) => <TripCard key={t.id} trip={t} index={i} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
