import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError, money, csym } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import BlobImage from "@/components/BlobImage";
import TripChat from "@/components/TripChat";
import TripItinerary from "@/components/TripItinerary";
import { Plus, Copy, Receipt, HandCoins, BellRinging, CreditCard, CheckCircle, Camera, NotePencil, Trash, Play, LinkSimple, PencilSimple, LinkBreak, DotsThreeVertical, Archive } from "@phosphor-icons/react";
import { toast } from "sonner";

const CATEGORIES = ["stay", "food", "transport", "activities", "other"];

function ExpenseDialog({ trip, myMemberId, expense = null, prefill = null, onClose, onDone }) {
  const sym = csym(trip.currency);
  const [form, setForm] = useState(() =>
    expense
      ? { description: expense.description, amount: String(expense.amount), category: expense.category, paid_by: expense.paid_by, split_type: expense.split_type }
      : { description: prefill?.description || "", amount: "", category: prefill?.category || "food", paid_by: myMemberId || "", split_type: "equal" }
  );
  const [selected, setSelected] = useState(() =>
    expense && expense.split_type === "equal" ? expense.splits.map((s) => s.member_id) : trip.members.map((m) => m.member_id)
  );
  const [customAmts, setCustomAmts] = useState(() =>
    expense && expense.split_type === "custom" ? Object.fromEntries(expense.splits.map((s) => [s.member_id, String(s.amount)])) : {}
  );
  const [percents, setPercents] = useState(() =>
    expense && expense.split_type === "percentage" ? Object.fromEntries(expense.splits.map((s) => [s.member_id, ((s.amount / expense.amount) * 100).toFixed(2)])) : {}
  );
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const amount = Number(form.amount);
    if (!form.description || !amount || !form.paid_by) return toast.error("Fill description, amount and payer");
    let splits = [];
    if (form.split_type === "equal") {
      if (!selected.length) return toast.error("Select at least one member to split with");
      splits = selected.map((id) => ({ member_id: id }));
    } else if (form.split_type === "custom") {
      splits = trip.members.map((m) => ({ member_id: m.member_id, amount: Number(customAmts[m.member_id]) || 0 })).filter((s) => s.amount > 0);
    } else {
      splits = trip.members.map((m) => ({ member_id: m.member_id, percent: Number(percents[m.member_id]) || 0 })).filter((s) => s.percent > 0);
    }
    setSaving(true);
    try {
      if (expense) {
        await api.put(`/trips/${trip.id}/expenses/${expense.id}`, { ...form, amount, splits });
        toast.success("Expense updated — balances recalculated");
      } else {
        await api.post(`/trips/${trip.id}/expenses`, { ...form, amount, splits });
        toast.success("Expense added");
      }
      onDone();
    } catch (e) {
      toast.error(formatApiError(e));
    }
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" data-testid="add-expense-dialog">
        <DialogHeader><DialogTitle className="font-display text-2xl">{expense ? "Edit expense" : "Log an expense"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>What was it?</Label>
              <Input data-testid="expense-description-input" placeholder="Beach shack dinner" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Amount ({sym})</Label>
              <Input data-testid="expense-amount-input" type="number" min="1" placeholder="2400" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger data-testid="expense-category-select" className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Who paid?</Label>
            <Select value={form.paid_by} onValueChange={(v) => setForm({ ...form, paid_by: v })}>
              <SelectTrigger data-testid="expense-paidby-select" className="rounded-xl"><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent>{trip.members.map((m) => <SelectItem key={m.member_id} value={m.member_id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>How to split?</Label>
            <RadioGroup value={form.split_type} onValueChange={(v) => setForm({ ...form, split_type: v })} className="flex gap-4">
              {[["equal", "Equally"], ["custom", `Custom ${sym.trim()}`], ["percentage", "By %"]].map(([v, l]) => (
                <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <RadioGroupItem data-testid={`split-type-${v}`} value={v} /> {l}
                </label>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2 bg-[#FDF3EC] rounded-xl p-4">
            {form.split_type === "equal" && trip.members.map((m) => (
              <label key={m.member_id} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  data-testid={`split-member-${m.member_id}`}
                  checked={selected.includes(m.member_id)}
                  onCheckedChange={(c) => setSelected(c ? [...selected, m.member_id] : selected.filter((x) => x !== m.member_id))}
                />
                {m.name}
              </label>
            ))}
            {form.split_type === "custom" && trip.members.map((m) => (
              <div key={m.member_id} className="flex items-center gap-2">
                <span className="text-sm flex-1">{m.name}</span>
                <Input data-testid={`custom-amount-${m.member_id}`} type="number" min="0" placeholder={sym.trim()} className="w-28 rounded-xl h-9 bg-white" value={customAmts[m.member_id] || ""} onChange={(e) => setCustomAmts({ ...customAmts, [m.member_id]: e.target.value })} />
              </div>
            ))}
            {form.split_type === "percentage" && trip.members.map((m) => (
              <div key={m.member_id} className="flex items-center gap-2">
                <span className="text-sm flex-1">{m.name}</span>
                <Input data-testid={`percent-${m.member_id}`} type="number" min="0" max="100" placeholder="%" className="w-24 rounded-xl h-9 bg-white" value={percents[m.member_id] || ""} onChange={(e) => setPercents({ ...percents, [m.member_id]: e.target.value })} />
              </div>
            ))}
          </div>
          <Button data-testid="expense-submit-btn" onClick={submit} disabled={saving} className="w-full rounded-full bg-[#E25822] hover:bg-[#C84B1A] h-11">
            {saving ? "Saving…" : expense ? "Save changes" : "Add expense"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MemoriesTab({ trip, userId, isOrganizer }) {
  const [memories, setMemories] = useState([]);
  const [note, setNote] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const getShareToken = async () => (await api.post(`/trips/${trip.id}/recap/share`)).data.token;

  const playRecap = async () => {
    try {
      navigate(`/recap/${await getShareToken()}`);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const copyShare = async () => {
    try {
      const t = await getShareToken();
      await navigator.clipboard.writeText(`${window.location.origin}/api/recap/${t}/share`);
      toast.success("Share link copied — it shows a rich preview card on WhatsApp & socials");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const revokeShare = async () => {
    try {
      await api.post(`/trips/${trip.id}/recap/revoke`);
      toast.success("Share link disabled — old links no longer work");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const load = useCallback(() => {
    api.get(`/trips/${trip.id}/memories`).then((r) => setMemories(r.data)).catch(() => {});
  }, [trip.id]);
  useEffect(() => { load(); }, [load]);

  const uploadPhoto = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("caption", caption);
    setUploading(true);
    try {
      await api.post(`/trips/${trip.id}/memories/photo`, fd);
      setCaption("");
      toast.success("Photo added to trip memories");
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const addNote = async () => {
    if (!note.trim()) return;
    try {
      await api.post(`/trips/${trip.id}/memories/note`, { text: note.trim() });
      setNote("");
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const del = async (mid) => {
    try {
      await api.delete(`/memories/${mid}`);
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <div>
      <div className="bg-[#0B4F6C] text-white rounded-2xl p-5 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden grain">
        <div>
          <p className="font-display text-lg font-bold">Trip recap slideshow</p>
          <p className="text-sm text-white/75">Relive the photos & notes as a story — and share it with anyone.</p>
        </div>
        <div className="flex gap-2 shrink-0 relative z-10">
          <Button data-testid="play-recap-btn" onClick={playRecap} className="rounded-full bg-[#E25822] hover:bg-[#C84B1A]">
            <Play size={15} className="mr-1.5" weight="fill" /> Play recap
          </Button>
          <Button data-testid="copy-recap-link-btn" onClick={copyShare} variant="outline" className="rounded-full bg-white/10 border-white/40 text-white hover:bg-white hover:text-[#1A1A1A] transition-colors">
            <LinkSimple size={15} className="mr-1.5" /> Share link
          </Button>
          {isOrganizer && (
            <Button data-testid="revoke-recap-link-btn" onClick={revokeShare} variant="ghost" className="rounded-full text-white/70 hover:text-white hover:bg-white/15">
              <LinkBreak size={15} className="mr-1.5" /> Revoke
            </Button>
          )}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#EAE3D9] rounded-2xl p-5">
          <p className="font-semibold flex items-center gap-2 mb-3"><Camera size={20} weight="duotone" className="text-[#E25822]" /> Add a photo</p>
          <Input data-testid="memory-caption-input" placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} className="rounded-xl" />
          <input ref={fileRef} data-testid="memory-file-input" type="file" accept="image/*" className="hidden" onChange={(e) => uploadPhoto(e.target.files?.[0])} />
          <Button data-testid="memory-upload-btn" onClick={() => fileRef.current?.click()} disabled={uploading} variant="outline" className="rounded-full mt-3">
            {uploading ? "Uploading…" : "Choose photo & upload"}
          </Button>
        </div>
        <div className="bg-white border border-[#EAE3D9] rounded-2xl p-5">
          <p className="font-semibold flex items-center gap-2 mb-3"><NotePencil size={20} weight="duotone" className="text-[#0B4F6C]" /> Add a note</p>
          <Textarea data-testid="memory-note-input" placeholder="Sunset at Palolem was unreal…" value={note} onChange={(e) => setNote(e.target.value)} className="rounded-xl" rows={2} />
          <Button data-testid="memory-note-btn" onClick={addNote} variant="outline" className="rounded-full mt-3">Add note</Button>
        </div>
      </div>

      {memories.length === 0 ? (
        <p className="text-muted-foreground text-sm py-10 text-center">No memories yet — add the first photo or note from your trip.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {memories.map((m) => (
            <div key={m.id} data-testid="memory-card" className="bg-white border border-[#EAE3D9] rounded-2xl overflow-hidden group relative">
              {m.kind === "photo" ? (
                <>
                  <BlobImage path={`/memories/${m.id}/image`} alt={m.caption || "Trip memory"} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    {m.caption && <p className="text-sm font-medium">{m.caption}</p>}
                    <p className="text-xs text-muted-foreground mt-1">by {m.member_name}</p>
                  </div>
                </>
              ) : (
                <div className="p-5 bg-[#FDF3EC] h-full">
                  <NotePencil size={18} weight="duotone" className="text-[#0B4F6C]" />
                  <p className="text-sm mt-2 whitespace-pre-wrap">{m.note}</p>
                  <p className="text-xs text-muted-foreground mt-3">— {m.member_name}</p>
                </div>
              )}
              {m.created_by === userId && (
                <button data-testid="memory-delete-btn" onClick={() => del(m.id)} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Trash size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TripDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [contribution, setContribution] = useState("");
  const [newMember, setNewMember] = useState({ name: "", email: "" });
  const [expenseDialog, setExpenseDialog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteTripOpen, setDeleteTripOpen] = useState(false);
  const [settleTarget, setSettleTarget] = useState(null);
  const [settleNote, setSettleNote] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [settling, setSettling] = useState(false);
  const [proofView, setProofView] = useState(null);
  const [activeTab, setActiveTab] = useState("expenses");
  const [chatUnread, setChatUnread] = useState(0);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    api.get(`/trips/${id}`).then((r) => setTrip(r.data)).catch((e) => {
      if (e?.response?.status === 404 || e?.response?.status === 400) setNotFound(true);
    });
    api.get(`/trips/${id}/expenses`).then((r) => setExpenses(r.data)).catch(() => {});
    api.get(`/trips/${id}/balances`).then((r) => setBalances(r.data)).catch(() => {});
  }, [id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const fetchUnread = () => api.get(`/trips/${id}/messages/unread`).then((r) => setChatUnread(r.data.count)).catch(() => {});
    fetchUnread();
    const t = setInterval(fetchUnread, 10000);
    return () => clearInterval(t);
  }, [id]);

  if (notFound)
    return (
      <div className="max-w-5xl mx-auto px-5 py-24 text-center" data-testid="trip-not-found">
        <p className="font-display text-3xl font-bold">Trip not found</p>
        <p className="text-muted-foreground mt-2 text-sm">It may have been deleted, or the link is wrong.</p>
        <Button onClick={() => navigate("/trips")} className="rounded-full bg-[#E25822] hover:bg-[#C84B1A] mt-6" data-testid="back-to-trips-btn">Back to your trips</Button>
      </div>
    );
  if (!trip) return <div className="max-w-5xl mx-auto px-5 py-20 text-center text-muted-foreground">Loading trip…</div>;

  const memberOf = (mid) => trip.members.find((m) => m.member_id === mid) || { name: "?" };
  const myMember = trip.members.find((m) => m.user_id === user?.id);
  const isOrganizer = trip.organizer_id === user?.id;
  const fmt = (n) => money(n, trip.currency);
  const sym = csym(trip.currency);
  const spent = balances?.total_spent || 0;
  const pct = trip.budget_total > 0 ? Math.min((spent / trip.budget_total) * 100, 100) : 0;

  const copyInvite = () => {
    navigator.clipboard.writeText(trip.invite_code);
    toast.success("Invite code copied — share it with your crew");
  };

  const remind = async (s) => {
    try {
      await api.post(`/trips/${id}/remind`, s);
      toast.success(`Reminder sent to ${memberOf(s.from_member_id).name}`);
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const payCard = async (s) => {
    try {
      const { data } = await api.post("/payments/checkout", {
        purpose: "settlement", origin_url: window.location.origin,
        trip_id: id, from_member_id: s.from_member_id, to_member_id: s.to_member_id,
      });
      window.location.href = data.checkout_url;
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const confirmDeleteExpense = async () => {
    try {
      await api.delete(`/trips/${id}/expenses/${deleteTarget.id}`);
      toast.success("Expense deleted — balances recalculated");
      setDeleteTarget(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const confirmSettle = async () => {
    setSettling(true);
    try {
      const { data: st } = await api.post(`/trips/${id}/settlements`, {
        from_member_id: settleTarget.from_member_id,
        to_member_id: settleTarget.to_member_id,
        amount: settleTarget.amount,
        method: "upi",
        note: settleNote || "Marked settled manually",
      });
      if (proofFile) {
        const fd = new FormData();
        fd.append("file", proofFile);
        await api.post(`/trips/${id}/settlements/${st.id}/proof`, fd);
      }
      toast.success("Marked as settled");
      setSettleTarget(null);
      setSettleNote("");
      setProofFile(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
    setSettling(false);
  };

  const saveContribution = async () => {
    try {
      await api.put(`/trips/${id}/contribution`, { contribution: Number(contribution) || 0 });
      toast.success("Contribution saved");
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const toggleArchive = async () => {
    try {
      await api.post(`/trips/${id}/${trip.archived ? "unarchive" : "archive"}`);
      toast.success(trip.archived ? "Trip unarchived" : "Trip archived — find it under Archived on your trips page");
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const confirmDeleteTrip = async () => {
    try {
      await api.delete(`/trips/${id}`);
      toast.success("Trip deleted");
      navigate("/trips");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const addMember = async () => {
    if (!newMember.email.trim()) return;
    try {
      await api.post(`/trips/${id}/members`, newMember);
      toast.success("Member added");
      setNewMember({ name: "", email: "" });
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="uppercase tracking-[0.25em] text-xs font-semibold text-[#E25822] mb-2">{trip.destination} · {trip.start_date} → {trip.end_date}</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold" data-testid="trip-title">
            {trip.name}
            {trip.archived && <Badge variant="outline" data-testid="trip-archived-badge" className="ml-3 align-middle text-amber-700 border-amber-300 font-sans">Archived</Badge>}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button data-testid="copy-invite-btn" onClick={copyInvite} variant="outline" className="rounded-full">
            <Copy size={16} className="mr-1.5" /> Invite code: {trip.invite_code}
          </Button>
          <Button data-testid="add-expense-btn" onClick={() => setExpenseDialog({ expense: null })} className="rounded-full bg-[#E25822] hover:bg-[#C84B1A]">
            <Plus size={17} className="mr-1" /> Add expense
          </Button>
          {isOrganizer && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button data-testid="trip-menu-btn" variant="outline" size="icon" className="rounded-full shrink-0" aria-label="Trip options">
                  <DotsThreeVertical size={18} weight="bold" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem data-testid="trip-archive-btn" onClick={toggleArchive} className="cursor-pointer">
                  <Archive size={15} className="mr-2" /> {trip.archived ? "Unarchive trip" : "Archive trip"}
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="trip-delete-btn" onClick={() => setDeleteTripOpen(true)} className="cursor-pointer text-red-600 focus:text-red-600">
                  <Trash size={15} className="mr-2" /> Delete trip
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#EAE3D9] rounded-2xl p-6 mt-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Total spent</p>
            <p className="font-display text-3xl font-bold" data-testid="trip-total-spent">{fmt(spent)} <span className="text-base text-muted-foreground font-normal">of {fmt(trip.budget_total)}</span></p>
          </div>
          <Badge className={`border-0 ${pct > 90 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>{Math.round(pct)}% used</Badge>
        </div>
        <Progress value={pct} className="h-2.5" />
        {balances && Object.keys(balances.by_category).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(balances.by_category).map(([cat, amt]) => {
              const budget = trip.budget_categories?.[cat];
              const over = budget && amt > budget;
              return (
                <Badge key={cat} variant="outline" data-testid={`category-chip-${cat}`} className={`capitalize py-1.5 px-3 ${over ? "border-red-400 text-red-700 bg-red-50" : ""}`}>
                  {cat}: {fmt(amt)}{budget ? ` / ${fmt(budget)}` : ""}{over ? " — over!" : ""}
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === "chat") setChatUnread(0); }} className="mt-10">
        <TabsList className="rounded-full h-12 p-1 bg-[#F5EFE5] max-w-full overflow-x-auto justify-start">
          <TabsTrigger data-testid="trip-tab-expenses" value="expenses" className="rounded-full px-6 h-10 data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">Expenses</TabsTrigger>
          <TabsTrigger data-testid="trip-tab-balances" value="balances" className="rounded-full px-6 h-10 data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">Balances</TabsTrigger>
          <TabsTrigger data-testid="trip-tab-itinerary" value="itinerary" className="rounded-full px-6 h-10 data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">Itinerary</TabsTrigger>
          <TabsTrigger data-testid="trip-tab-chat" value="chat" className="rounded-full px-6 h-10 data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">
            Chat
            {chatUnread > 0 && (
              <span data-testid="chat-unread-badge" className="ml-1.5 h-5 min-w-5 px-1 rounded-full bg-[#E25822] text-white text-[10px] inline-flex items-center justify-center font-bold">{chatUnread}</span>
            )}
          </TabsTrigger>
          <TabsTrigger data-testid="trip-tab-members" value="members" className="rounded-full px-6 h-10 data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">Members</TabsTrigger>
          <TabsTrigger data-testid="trip-tab-memories" value="memories" className="rounded-full px-6 h-10 data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white">Memories</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-6 space-y-3">
          {expenses.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No expenses yet — log the first one.</p>}
          {expenses.map((e) => (
            <div key={e.id} data-testid="expense-item" className="bg-white border border-[#EAE3D9] rounded-2xl p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-[#FDF3EC] flex items-center justify-center shrink-0">
                <Receipt size={22} weight="duotone" className="text-[#E25822]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{e.description} {e.edited_at && <span className="text-xs text-muted-foreground font-normal">(edited)</span>}</p>
                <p className="text-sm text-muted-foreground">Paid by {memberOf(e.paid_by).name} · split {e.split_type} · <span className="capitalize">{e.category}</span></p>
              </div>
              <p className="font-display text-xl font-bold">{fmt(e.amount)}</p>
              {(e.created_by === user?.id || trip.organizer_id === user?.id) && (
                <div className="flex gap-1 shrink-0">
                  <button data-testid="edit-expense-btn" onClick={() => setExpenseDialog({ expense: e })} className="h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground transition-colors" aria-label="Edit expense">
                    <PencilSimple size={15} />
                  </button>
                  <button data-testid="delete-expense-btn" onClick={() => setDeleteTarget(e)} className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-muted-foreground transition-colors" aria-label="Delete expense">
                    <Trash size={15} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="balances" className="mt-6">
          {balances && (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {trip.members.map((m) => {
                  const net = balances.net[m.member_id] || 0;
                  return (
                    <div key={m.member_id} data-testid="balance-card" className="bg-white border border-[#EAE3D9] rounded-2xl p-5">
                      <p className="font-semibold">{m.name}</p>
                      <p className={`font-display text-2xl font-bold mt-1 ${net > 0.01 ? "text-emerald-700" : net < -0.01 ? "text-[#C84B1A]" : "text-muted-foreground"}`}>
                        {net > 0.01 ? `gets back ${fmt(net)}` : net < -0.01 ? `owes ${fmt(-net)}` : "settled up"}
                      </p>
                    </div>
                  );
                })}
              </div>

              <h3 className="font-display text-xl font-bold mt-10 mb-4 flex items-center gap-2"><HandCoins size={22} weight="duotone" className="text-[#E25822]" /> Settle up</h3>
              {balances.suggestions.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center">
                  <CheckCircle size={32} weight="duotone" className="text-emerald-600 mx-auto" />
                  <p className="font-semibold mt-2">All settled — no one owes anyone.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {balances.suggestions.map((s, i) => {
                    const iOwe = myMember?.member_id === s.from_member_id;
                    return (
                      <div key={i} data-testid="settlement-suggestion" className="bg-white border border-[#EAE3D9] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <p className="flex-1 text-sm sm:text-base">
                          <span className="font-bold">{memberOf(s.from_member_id).name}</span> owes{" "}
                          <span className="font-bold">{memberOf(s.to_member_id).name}</span>{" "}
                          <span className="font-display text-xl font-bold text-[#C84B1A]">{fmt(s.amount)}</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {iOwe && s.upi_link && (
                            <a data-testid="settle-upi-btn" href={s.upi_link} className="inline-flex items-center text-sm font-bold text-white bg-[#E25822] hover:bg-[#C84B1A] rounded-full px-5 py-2 transition-colors">
                              Pay via UPI
                            </a>
                          )}
                          {iOwe && (
                            <Button data-testid="settle-card-btn" onClick={() => payCard(s)} size="sm" variant="outline" className="rounded-full">
                              <CreditCard size={15} className="mr-1.5" /> Pay by card
                            </Button>
                          )}
                          {!iOwe && (
                            <Button data-testid="settle-remind-btn" onClick={() => remind(s)} size="sm" variant="outline" className="rounded-full">
                              <BellRinging size={15} className="mr-1.5" /> Remind
                            </Button>
                          )}
                          <Button data-testid="settle-mark-btn" onClick={() => setSettleTarget(s)} size="sm" variant="ghost" className="rounded-full text-muted-foreground">
                            Mark settled
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {balances.settlements.length > 0 && (
                <>
                  <h3 className="font-display text-lg font-bold mt-10 mb-3">Settlement history</h3>
                  <div className="space-y-2">
                    {balances.settlements.map((st) => (
                      <div key={st.id} data-testid="settlement-history-item" className="bg-white border border-[#EAE3D9] rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                        <span>{memberOf(st.from_member_id).name} paid {memberOf(st.to_member_id).name} <b>{fmt(st.amount)}</b> <span className="text-muted-foreground">via {st.method}</span></span>
                        <span className="flex items-center gap-3">
                          {st.proof_path && (
                            <button data-testid="view-proof-btn" onClick={() => setProofView(st.id)} className="text-xs font-semibold text-[#0B4F6C] hover:underline flex items-center gap-1">
                              <Camera size={14} /> Proof
                            </button>
                          )}
                          <CheckCircle size={18} weight="duotone" className="text-emerald-600" />
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="itinerary" className="mt-6">
          <TripItinerary
            trip={trip}
            userId={user?.id}
            isOrganizer={isOrganizer}
            onLogExpense={(it) => setExpenseDialog({ expense: null, key: `plan-${it.id}`, prefill: { description: it.title, category: "activities" } })}
          />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <TripChat tripId={id} myUserId={user?.id} />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="space-y-3">
            {trip.members.map((m) => (
              <div key={m.member_id} data-testid="member-item" className="bg-white border border-[#EAE3D9] rounded-2xl p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-[#E8DCC4] flex items-center justify-center font-bold">{m.name.charAt(0).toUpperCase()}</div>
                <div className="flex-1">
                  <p className="font-semibold">{m.name} {m.member_id === trip.organizer_member_id && <Badge variant="outline" className="ml-1 text-[10px]">Organizer</Badge>} {!m.user_id && <Badge variant="outline" className="ml-1 text-[10px] text-amber-700 border-amber-300">Invited</Badge>}</p>
                  <p className="text-sm text-muted-foreground">{m.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Bringing</p>
                  <p className="font-bold">{fmt(m.contribution)}</p>
                </div>
              </div>
            ))}
          </div>

          {myMember && (
            <div className="bg-[#FDF3EC] border border-[#EAE3D9] rounded-2xl p-5 mt-6 flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="space-y-1.5 flex-1 max-w-xs">
                <Label>How much are you bringing? ({sym.trim()})</Label>
                <Input data-testid="contribution-input" type="number" min="0" placeholder={String(myMember.contribution || 0)} value={contribution} onChange={(e) => setContribution(e.target.value)} className="rounded-xl bg-white" />
              </div>
              <Button data-testid="contribution-save-btn" onClick={saveContribution} className="rounded-full bg-[#0B4F6C] hover:bg-[#083D54]">Save</Button>
            </div>
          )}

          <div className="bg-white border border-[#EAE3D9] rounded-2xl p-5 mt-4">
            <Label className="mb-2 block">Add a member by email</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input data-testid="new-member-name" placeholder="Name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="rounded-xl" />
              <Input data-testid="new-member-email" placeholder="email@example.com" value={newMember.email} onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} className="rounded-xl" />
              <Button data-testid="new-member-add-btn" onClick={addMember} variant="outline" className="rounded-full shrink-0">Add member</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="memories" className="mt-6">
          <MemoriesTab trip={trip} userId={user?.id} isOrganizer={isOrganizer} />
        </TabsContent>
      </Tabs>

      {expenseDialog && (
        <ExpenseDialog
          key={expenseDialog.expense?.id || expenseDialog.key || "new"}
          trip={trip}
          myMemberId={myMember?.member_id}
          expense={expenseDialog.expense}
          prefill={expenseDialog.prefill}
          onClose={() => setExpenseDialog(null)}
          onDone={() => { setExpenseDialog(null); load(); }}
        />
      )}

      <Dialog open={deleteTripOpen} onOpenChange={setDeleteTripOpen}>
        <DialogContent data-testid="delete-trip-dialog">
          <DialogHeader><DialogTitle className="font-display text-2xl">Delete this trip?</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm bg-red-50 border border-red-100 rounded-xl p-4">
              <b>{trip.name}</b> and everything in it — expenses, balances, chat, memories and settlement history — will be permanently deleted for all {trip.members.length} members.
            </p>
            <p className="text-xs text-muted-foreground">If you just want it out of the way, archive it instead — nothing gets lost.</p>
            <div className="flex gap-2">
              <Button data-testid="confirm-delete-trip-btn" onClick={confirmDeleteTrip} className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white">Delete forever</Button>
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setDeleteTripOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent data-testid="delete-expense-dialog">
          <DialogHeader><DialogTitle className="font-display text-2xl">Delete this expense?</DialogTitle></DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <p className="text-sm bg-[#FDF3EC] rounded-xl p-4">
                <b>{deleteTarget.description}</b> · {fmt(deleteTarget.amount)} paid by {memberOf(deleteTarget.paid_by).name}
              </p>
              <p className="text-xs text-muted-foreground">Balances will be recalculated for everyone. This can't be undone.</p>
              <div className="flex gap-2">
                <Button data-testid="confirm-delete-expense-btn" onClick={confirmDeleteExpense} className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white">Delete expense</Button>
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!settleTarget} onOpenChange={(v) => !v && setSettleTarget(null)}>
        <DialogContent data-testid="settle-dialog">
          <DialogHeader><DialogTitle className="font-display text-2xl">Mark as settled</DialogTitle></DialogHeader>
          {settleTarget && (
            <div className="space-y-4">
              <p className="text-sm bg-[#FDF3EC] rounded-xl p-4">
                <b>{memberOf(settleTarget.from_member_id).name}</b> paid <b>{memberOf(settleTarget.to_member_id).name}</b>{" "}
                <span className="font-display text-lg font-bold">{fmt(settleTarget.amount)}</span>
              </p>
              <div className="space-y-1.5">
                <Label>Note (optional)</Label>
                <Input data-testid="settle-note-input" placeholder="Paid via GPay" value={settleNote} onChange={(e) => setSettleNote(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Payment proof screenshot (optional)</Label>
                <Input data-testid="settle-proof-input" type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0] || null)} className="rounded-xl" />
                {proofFile && <p className="text-xs text-muted-foreground">Attached: {proofFile.name}</p>}
              </div>
              <Button data-testid="settle-confirm-btn" onClick={confirmSettle} disabled={settling} className="w-full rounded-full bg-[#E25822] hover:bg-[#C84B1A] h-11">
                {settling ? "Saving…" : "Confirm settlement"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!proofView} onOpenChange={(v) => !v && setProofView(null)}>
        <DialogContent data-testid="proof-dialog" className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-2xl">Payment proof</DialogTitle></DialogHeader>
          {proofView && <BlobImage path={`/settlements/${proofView}/proof`} alt="Payment proof" className="w-full rounded-xl max-h-[60vh] object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
