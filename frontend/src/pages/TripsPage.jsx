import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api, { formatApiError, inr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UsersThree, Plus, SignIn, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

const CATEGORIES = ["stay", "food", "transport", "activities"];
const today = new Date().toISOString().split("T")[0];

function CreateTripDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", destination: "", start_date: today, end_date: today, budget_total: "" });
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
        members: members.filter((m) => m.email.trim()),
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
        <Button data-testid="create-trip-btn" className="rounded-full bg-[#E25822] hover:bg-[#C84B1A] h-11 px-6">
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
          <div className="space-y-1.5">
            <Label>Total budget (₹)</Label>
            <Input data-testid="trip-budget-input" type="number" min="0" placeholder="40000" value={form.budget_total} onChange={(e) => setForm({ ...form, budget_total: e.target.value })} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Budget by category (optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <Input key={c} data-testid={`trip-budget-${c}`} type="number" min="0" placeholder={`${c} ₹`} value={catBudget[c] || ""} onChange={(e) => setCatBudget({ ...catBudget, [c]: e.target.value })} className="rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Group members (by email)</Label>
              <Button data-testid="add-member-row-btn" size="sm" variant="outline" className="rounded-full h-7" onClick={() => setMembers([...members, { name: "", email: "" }])}>+ Add</Button>
            </div>
            {members.map((m, i) => (
              <div key={i} className="flex gap-2">
                <Input data-testid={`member-name-${i}`} placeholder="Name" value={m.name} onChange={(e) => setMembers(members.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className="rounded-xl" />
                <Input data-testid={`member-email-${i}`} placeholder="email@example.com" value={m.email} onChange={(e) => setMembers(members.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))} className="rounded-xl" />
                <Button size="icon" variant="ghost" onClick={() => setMembers(members.filter((_, j) => j !== i))}><Trash size={16} /></Button>
              </div>
            ))}
          </div>
          <Button data-testid="trip-submit-btn" onClick={submit} disabled={saving} className="w-full rounded-full bg-[#E25822] hover:bg-[#C84B1A] h-11">
            {saving ? "Creating…" : "Create trip"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TripsPage() {
  const [trips, setTrips] = useState(null);
  const [code, setCode] = useState("");
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
          <p className="uppercase tracking-[0.25em] text-xs font-semibold text-[#E25822] mb-2">Group travel planner</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold">Your trips</h1>
        </div>
        <CreateTripDialog onCreated={(t) => navigate(`/trips/${t.id}`)} />
      </div>

      <div className="mt-8 bg-white border border-[#EAE3D9] rounded-2xl p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
        <p className="text-sm font-medium flex items-center gap-2"><SignIn size={18} className="text-[#0B4F6C]" /> Got an invite code?</p>
        <div className="flex gap-2 flex-1 sm:max-w-sm">
          <Input data-testid="join-code-input" placeholder="e.g. xY3kPq_z" value={code} onChange={(e) => setCode(e.target.value)} className="rounded-xl" />
          <Button data-testid="join-trip-btn" onClick={join} variant="outline" className="rounded-full">Join</Button>
        </div>
      </div>

      {trips === null ? (
        <p className="mt-10 text-muted-foreground">Loading…</p>
      ) : trips.length === 0 ? (
        <div className="mt-10 bg-[#0B4F6C] text-white rounded-2xl p-12 text-center relative overflow-hidden grain">
          <UsersThree size={40} weight="duotone" className="text-[#F9B384] mx-auto" />
          <p className="font-display text-2xl font-bold mt-4">No trips yet</p>
          <p className="text-white/75 mt-2 max-w-md mx-auto text-sm">Create a travel plan, invite your crew, set a budget and let Travelo handle the money math.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5 mt-10">
          {trips.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/trips/${t.id}`} data-testid="trip-card" className="block bg-white border border-[#EAE3D9] rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-[box-shadow,transform] duration-300">
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-xl font-bold">{t.name}</h3>
                  <Badge variant="outline" className="border-[#0B4F6C] text-[#0B4F6C] shrink-0">{t.members.length} members</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t.destination} · {t.start_date} → {t.end_date}</p>
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex -space-x-2">
                    {t.members.slice(0, 4).map((m) => (
                      <div key={m.member_id} className="h-8 w-8 rounded-full bg-[#E8DCC4] border-2 border-white flex items-center justify-center text-xs font-bold text-[#1A1A1A]">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-bold ml-auto">{inr(t.budget_total)} budget</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
