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
            <div className="space-y-1.5 col-span-2"><Label>What was it?</Label><Input data-testid="expense-description-input" placeholder="Beach shack dinner" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Amount ({sym})</Label><Input data-testid="expense-amount-input" type="number" min="1" placeholder="2400" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger data-testid="expense-category-select" className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Who paid?</Label>
            <Select value={form.paid_by} onValueChange={(v) => setForm({ ...form, paid_by: v })}>
              <SelectTrigger data-testid="expense-paidby-select" className="rounded-xl"><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent>{trip.members.map((m) => <SelectItem key={m.member_id} value={m.member_id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Split type</Label>
            <RadioGroup value={form.split_type} onValueChange={(v) => setForm({ ...form, split_type: v })} className="flex gap-4">
              {["equal", "custom", "percentage"].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <RadioGroupItem value={t} id={`st-${t}`} data-testid={`split-${t}`} />
                  <Label htmlFor={`st-${t}`} className="capitalize cursor-pointer">{t}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          {form.split_type === "equal" && (
            <div className="space-y-2">
              <Label>Split among</Label>
              {trip.members.map((m) => (
                <div key={m.member_id} className="flex items-center gap-2">
                  <Checkbox checked={selected.includes(m.member_id)} onCheckedChange={(ch) => setSelected(ch ? [...selected, m.member_id] : selected.filter((x) => x !== m.member_id))} data-testid={`split-member-${m.member_id}`} />
                  <Label className="cursor-pointer">{m.name}</Label>
                </div>
              ))}
            </div>
          )}
          {form.split_type === "custom" && (
            <div className="space-y-2">
              <Label>Custom amounts ({sym})</Label>
              {trip.members.map((m) => (
                <div key={m.member_id} className="flex items-center gap-3">
                  <span className="text-sm w-24 truncate">{m.name}</span>
                  <Input type="number" min="0" placeholder="0" value={customAmts[m.member_id] || ""} onChange={(e) => setCustomAmts({ ...customAmts, [m.member_id]: e.target.value })} className="rounded-xl flex-1" />
                </div>
              ))}
            </div>
          )}
          {form.split_type === "percentage" && (
            <div className="space-y-2">
              <Label>Percentages (must sum to 100)</Label>
              {trip.members.map((m) => (
                <div key={m.member_id} className="flex items-center gap-3">
                  <span className="text-sm w-24 truncate">{m.name}</span>
                  <Input type="number" min="0" max="100" placeholder="0" value={percents[m.member_id] || ""} onChange={(e) => setPercents({ ...percents, [m.member_id]: e.target.value })} className="rounded-xl flex-1" />
                  <span className="text-sm">%</span>
                </div>
              ))}
            </div>
          )}
          <Button data-testid="expense-submit-btn" onClick={submit} disabled={saving} className="w-full rounded-full bg-[#FF5A36] hover:bg-[#E64322] h-11">
            {saving ? "Saving…" : expense ? "Update expense" : "Add expense"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettleDialog({ trip, onClose, onDone }) {
  const [form, setForm] = useState({ from_member: "", to_member: "", amount: "" });
  const [saving, setSaving] = useState(false);
  const sym = csym(trip.currency);

  const submit = async () => {
    const amount = Number(form.amount);
    if (!form.from_member || !form.to_member || !amount) return toast.error("Fill all fields");
    if (form.from_member === form.to_member) return toast.error("From and to must be different members");
    setSaving(true);
    try {
      await api.post(`/trips/${trip.id}/settle`, { ...form, amount });
      toast.success("Settlement recorded");
      onDone();
    } catch (e) {
      toast.error(formatApiError(e));
    }
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm" data-testid="settle-dialog">
        <DialogHeader><DialogTitle className="font-display text-2xl">Record settlement</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Who paid?</Label>
            <Select value={form.from_member} onValueChange={(v) => setForm({ ...form, from_member: v })}>
              <SelectTrigger data-testid="settle-from-select" className="rounded-xl"><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent>{trip.members.map((m) => <SelectItem key={m.member_id} value={m.member_id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Who received?</Label>
            <Select value={form.to_member} onValueChange={(v) => setForm({ ...form, to_member: v })}>
              <SelectTrigger data-testid="settle-to-select" className="rounded-xl"><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent>{trip.members.map((m) => <SelectItem key={m.member_id} value={m.member_id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Amount ({sym})</Label><Input data-testid="settle-amount-input" type="number" min="1" placeholder="500" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="rounded-xl" /></div>
          <Button data-testid="settle-submit-btn" onClick={submit} disabled={saving} className="w-full rounded-full bg-[#FF5A36] hover:bg-[#E64322] h-11">{saving ? "Saving…" : "Record settlement"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const catEmoji = { stay: "🏠", food: "🍴", transport: "🚕", activities: "🎬", other: "💰" };
const catColor = { stay: "#00E5FF", food: "#FF4D00", transport: "#F5FF50", activities: "#FF2D6B", other: "#888888" };

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [showExpense, setShowExpense] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [showSettle, setShowSettle] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const fileRef = useRef();

  const myMemberId = trip?.members.find((m) => m.email === user?.email)?.member_id || "";

  const loadTrip = useCallback(async () => {
    try {
      const [t, e, b, s] = await Promise.all([
        api.get(`/trips/${id}`),
        api.get(`/trips/${id}/expenses`),
        api.get(`/trips/${id}/balances`),
        api.get(`/trips/${id}/settlements`),
      ]);
      setTrip(t.data);
      setExpenses(e.data);
      setBalances(b.data);
      setSettlements(s.data);
    } catch (e) {
      toast.error("Failed to load trip");
      navigate("/trips");
    }
  }, [id, navigate]);

  useEffect(() => { loadTrip(); }, [loadTrip]);

  const copyInvite = () => { navigator.clipboard.writeText(trip.invite_code); toast.success("Invite code copied!"); };

  const uploadCover = async (file) => {
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post(`/trips/${id}/cover`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setTrip((t) => ({ ...t, cover_url: data.cover_url }));
      toast.success("Cover updated!");
    } catch (e) { toast.error(formatApiError(e)); }
    setCoverUploading(false);
  };

  const archiveTrip = async () => {
    try {
      await api.patch(`/trips/${id}/archive`);
      toast.success("Trip archived");
      navigate("/trips");
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const deleteExpense = async (expId) => {
    try {
      await api.delete(`/trips/${id}/expenses/${expId}`);
      toast.success("Expense deleted");
      loadTrip();
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const aiSuggest = async () => {
    try {
      const { data } = await api.post(`/trips/${id}/ai-suggest`);
      setPrefill(data);
      setShowExpense(true);
    } catch (e) { toast.error(formatApiError(e)); }
  };

  const requestPayment = async (balance) => {
    try {
      const { data } = await api.post("/payments/request", { trip_id: id, from_member_id: balance.from_member, to_member_id: balance.to_member, amount: balance.amount });
      toast.success("Payment request sent!");
    } catch (e) { toast.error(formatApiError(e)); }
  };

  if (!trip) return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #FF4D00", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontFamily: "Anton, sans-serif", fontSize: 20, color: "#444444", letterSpacing: "0.1em" }}>LOADING MISSION...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const budgetPct = trip.budget_total > 0 ? Math.min((totalSpent / trip.budget_total) * 100, 100) : 0;
  const overBudget = trip.budget_total > 0 && totalSpent > trip.budget_total;

  return (
    <div style={{ minHeight: "100vh", background: "#080808", paddingTop: 88 }}><div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px 80px" }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 8 }}>
        <div>
          <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 10, letterSpacing: "0.3em", color: "#FF4D00", textTransform: "uppercase", marginBottom: 12 }}>{trip.destination} · {trip.start_date} → {trip.end_date}</p>
          <h1 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: "clamp(44px, 6vw, 80px)", lineHeight: 0.85, color: "white", margin: 0 }} data-testid="trip-title">
            {trip.name.toUpperCase()}
            {trip.archived && <Badge variant="outline" data-testid="trip-archived-badge" className="ml-3 align-middle text-amber-700 border-amber-300 font-sans">Archived</Badge>}
          </h1>
          <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 20, color: "#555555", margin: "10px 0 0" }}>
            "No cap. Someone owes someone. This page knows who."
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Button data-testid="copy-invite-btn" onClick={copyInvite} variant="outline" className="rounded-full">
            <Copy size={16} className="mr-1.5" /> Invite code: {trip.invite_code}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full" data-testid="trip-more-menu"><DotsThreeVertical size={18} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem data-testid="archive-trip-btn" onClick={archiveTrip}><Archive size={15} className="mr-2" /> Archive trip</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div style={{ position: "relative", height: 220, borderRadius: 16, overflow: "hidden", margin: "28px 0", background: "#111111" }}>
        {trip.cover_url ? (
          <BlobImage src={trip.cover_url} alt="Trip cover" className="w-full h-full object-cover" />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "repeating-linear-gradient(135deg, #111 0, #111 20px, #141414 20px, #141414 40px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 22, color: "#333" }}>"Add a cover photo — make it real."</p>
          </div>
        )}
        <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: 16, right: 16, background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, color: "white", fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 13, cursor: "pointer" }} data-testid="upload-cover-btn">
          {coverUploading ? <span>Uploading...</span> : <><Camera size={16} /> Change cover</>}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.[0]) uploadCover(e.target.files[0]); }} data-testid="cover-file-input" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div style={{ background: "#0F0F0F", border: "2px solid #1A1A1A", borderRadius: 14, padding: "20px 24px" }}>
          <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 10, letterSpacing: "0.2em", color: "#444", textTransform: "uppercase", marginBottom: 8 }}>TOTAL SPENT</p>
          <p style={{ fontFamily: "Anton, sans-serif", fontSize: 32, color: overBudget ? "#FF2D6B" : "white", margin: 0 }} data-testid="trip-total-spent">{money(totalSpent, trip.currency)}</p>
          {trip.budget_total > 0 && (
            <>
              <Progress value={budgetPct} className="mt-3 h-1.5" />
              <p style={{ fontFamily: "Space Grotesk", fontSize: 12, color: overBudget ? "#FF2D6B" : "#555", marginTop: 6 }}>{overBudget ? "OVER BUDGET" : `${budgetPct.toFixed(0)}% of ${money(trip.budget_total, trip.currency)}`}</p>
            </>
          )}
        </div>
        <div style={{ background: "#0F0F0F", border: "2px solid #1A1A1A", borderRadius: 14, padding: "20px 24px" }}>
          <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 10, letterSpacing: "0.2em", color: "#444", textTransform: "uppercase", marginBottom: 8 }}>EXPENSES</p>
          <p style={{ fontFamily: "Anton, sans-serif", fontSize: 32, color: "white", margin: 0 }} data-testid="trip-expense-count">{expenses.length}</p>
        </div>
        <div style={{ background: "#0F0F0F", border: "2px solid #1A1A1A", borderRadius: 14, padding: "20px 24px" }}>
          <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 10, letterSpacing: "0.2em", color: "#444", textTransform: "uppercase", marginBottom: 8 }}>SQUAD SIZE</p>
          <p style={{ fontFamily: "Anton, sans-serif", fontSize: 32, color: "white", margin: 0 }}>{trip.members.length}</p>
        </div>
        <div style={{ background: "#0F0F0F", border: "2px solid #1A1A1A", borderRadius: 14, padding: "20px 24px" }}>
          <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 10, letterSpacing: "0.2em", color: "#444", textTransform: "uppercase", marginBottom: 8 }}>OUTSTANDING</p>
          <p style={{ fontFamily: "Anton, sans-serif", fontSize: 32, color: balances.length > 0 ? "#F5FF50" : "#4ade80", margin: 0 }}>{balances.length > 0 ? `${balances.length} debts` : "All clear"}</p>
        </div>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList className="mb-6" data-testid="trip-tabs">
          <TabsTrigger value="expenses" data-testid="tab-expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances" data-testid="tab-balances">Who Owes What</TabsTrigger>
          <TabsTrigger value="itinerary" data-testid="tab-itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="chat" data-testid="tab-chat">Squad Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: 32, color: "white", margin: 0 }}>EXPENSE LOG</h2>
            <div style={{ display: "flex", gap: 10 }}>
              <Button data-testid="ai-suggest-btn" variant="outline" size="sm" onClick={aiSuggest} className="rounded-full">
                <Play size={14} className="mr-1.5" /> AI Suggest
              </Button>
              <Button data-testid="add-expense-btn" onClick={() => setShowExpense(true)} size="sm" className="rounded-full bg-[#FF5A36] hover:bg-[#E64322]">
                <Plus size={14} className="mr-1.5" /> Add expense
              </Button>
            </div>
          </div>
          {expenses.length === 0 ? (
            <div style={{ background: "#0F0F0F", border: "2px dashed #1A1A1A", borderRadius: 16, padding: "48px", textAlign: "center" }}>
              <Receipt size={40} color="#333" weight="thin" style={{ marginBottom: 16 }} />
              <p style={{ fontFamily: "Anton, sans-serif", fontSize: 28, color: "#333", margin: "0 0 8px" }}>NO EXPENSES YET</p>
              <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 18, color: "#444" }}>"First person to buy chai logs it immediately."</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }} data-testid="expense-list">
              {expenses.map((e) => (
                <div key={e.id} data-testid="expense-item" style={{ background: "#0F0F0F", border: "2px solid #1A1A1A", borderRadius: 12, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, transition: "border-color 0.15s" }} onMouseEnter={ev => ev.currentTarget.style.borderColor = catColor[e.category] || "#444"} onMouseLeave={ev => ev.currentTarget.style.borderColor = "#1A1A1A"}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${catColor[e.category] || "#666"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{catEmoji[e.category] || "💰"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 15, color: "white", margin: "0 0 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} data-testid="expense-description">{e.description}</p>
                    <p style={{ fontFamily: "Space Grotesk", fontSize: 12, color: "#555", margin: 0 }}>paid by {trip.members.find((m) => m.member_id === e.paid_by)?.name || "Unknown"} · {e.category}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontFamily: "Anton, sans-serif", fontSize: 20, color: "white", margin: "0 0 6px" }} data-testid="expense-amount">{money(e.amount, trip.currency)}</p>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <Button size="icon" variant="ghost" onClick={() => setEditExpense(e)} data-testid="edit-expense-btn" style={{ width: 28, height: 28 }}><PencilSimple size={14} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteExpense(e.id)} data-testid="delete-expense-btn" style={{ width: 28, height: 28 }}><Trash size={14} className="text-red-400" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="balances">
          <h2 style={{ fontFamily: "Anton, sans-serif", fontSize: 32, color: "white", margin: "0 0 20px" }}>WHO OWES WHAT</h2>
          {balances.length === 0 ? (
            <div style={{ background: "rgba(74,222,128,0.05)", border: "2px solid rgba(74,222,128,0.15)", borderRadius: 16, padding: "48px", textAlign: "center" }}>
              <CheckCircle size={40} color="#4ade80" weight="fill" style={{ marginBottom: 16 }} />
              <p style={{ fontFamily: "Anton, sans-serif", fontSize: 28, color: "#4ade80", margin: "0 0 8px" }}>ALL SETTLED UP</p>
              <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 18, color: "#555" }}>"This squad passes the vibe check."</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }} data-testid="balance-list">
              {balances.map((b, i) => {
                const from = trip.members.find((m) => m.member_id === b.from_member)?.name || "Unknown";
                const to = trip.members.find((m) => m.member_id === b.to_member)?.name || "Unknown";
                return (
                  <div key={i} data-testid="balance-item" style={{ background: "#0F0F0F", border: "2px solid #1A1A1A", borderRadius: 12, padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <HandCoins size={24} color="#F5FF50" weight="bold" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 15, color: "white", margin: "0 0 3px" }}>
                        <span style={{ color: "#FF4D00" }}>{from}</span> owes <span style={{ color: "#00E5FF" }}>{to}</span>
                      </p>
                      <p style={{ fontFamily: "Anton, sans-serif", fontSize: 22, color: "#F5FF50", margin: 0 }} data-testid="balance-amount">{money(b.amount, trip.currency)}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {b.from_member === myMemberId && (
                        <Button size="sm" variant="outline" className="rounded-full" onClick={() => requestPayment(b)} data-testid="request-payment-btn">
                          <BellRinging size={14} className="mr-1.5" /> Nudge
                        </Button>
                      )}
                      <Button size="sm" onClick={() => setShowSettle(true)} className="rounded-full bg-[#FF5A36] hover:bg-[#E64322]" data-testid="settle-btn">
                        <CreditCard size={14} className="mr-1.5" /> Settle
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {settlements.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontFamily: "Anton, sans-serif", fontSize: 24, color: "#555", margin: "0 0 16px" }}>PAST SETTLEMENTS</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {settlements.map((s, i) => {
                  const from = trip.members.find((m) => m.member_id === s.from_member)?.name || "?";
                  const to = trip.members.find((m) => m.member_id === s.to_member)?.name || "?";
                  return (
                    <div key={i} style={{ background: "#0F0F0F", border: "1.5px solid #1A1A1A", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontFamily: "Space Grotesk", fontSize: 14, color: "#555", margin: 0 }}>{from} → {to}</p>
                      <p style={{ fontFamily: "Anton, sans-serif", fontSize: 18, color: "#4ade80", margin: 0 }}>{money(s.amount, trip.currency)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="itinerary">
          <TripItinerary tripId={id} />
        </TabsContent>

        <TabsContent value="chat">
          <TripChat tripId={id} />
        </TabsContent>
      </Tabs>

      {showExpense && <ExpenseDialog trip={trip} myMemberId={myMemberId} prefill={prefill} onClose={() => { setShowExpense(false); setPrefill(null); }} onDone={() => { setShowExpense(false); setPrefill(null); loadTrip(); }} />}
      {editExpense && <ExpenseDialog trip={trip} myMemberId={myMemberId} expense={editExpense} onClose={() => setEditExpense(null)} onDone={() => { setEditExpense(null); loadTrip(); }} />}
      {showSettle && <SettleDialog trip={trip} onClose={() => setShowSettle(false)} onDone={() => { setShowSettle(false); loadTrip(); }} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div></div>
  );
}
