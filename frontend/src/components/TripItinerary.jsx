import { useCallback, useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, MapPin, Clock, PencilSimple, Trash, CalendarBlank, Receipt } from "@phosphor-icons/react";
import { toast } from "sonner";

const dayList = (start, end) => {
  const days = [];
  const d = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  let i = 0;
  while (d <= e && i < 60) {
    days.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
    i += 1;
  }
  return days.length ? days : [start];
};

const fmtDay = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });

function ItineraryDialog({ trip, days, item, defaultDate, onClose, onDone }) {
  const [form, setForm] = useState(() =>
    item
      ? { date: item.date, time: item.time || "", title: item.title, place: item.place || "", notes: item.notes || "" }
      : { date: defaultDate || days[0], time: "", title: "", place: "", notes: "" }
  );
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) return toast.error("Give this plan a title");
    setSaving(true);
    try {
      if (item) {
        await api.put(`/trips/${trip.id}/itinerary/${item.id}`, form);
        toast.success("Plan updated");
      } else {
        await api.post(`/trips/${trip.id}/itinerary`, form);
        toast.success("Added to the itinerary");
      }
      onDone();
    } catch (e) {
      toast.error(formatApiError(e));
    }
    setSaving(false);
  };

  const dateOptions = days.includes(form.date) ? days : [...days, form.date];

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md" data-testid="itinerary-dialog">
        <DialogHeader><DialogTitle className="font-display text-2xl">{item ? "Edit plan" : "Add to the plan"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>What's the plan?</Label>
            <Input data-testid="itinerary-title-input" placeholder="Sunrise trek to the fort" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Day</Label>
              <Select value={form.date} onValueChange={(v) => setForm({ ...form, date: v })}>
                <SelectTrigger data-testid="itinerary-date-select" className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dateOptions.map((d, i) => <SelectItem key={d} value={d}>Day {i + 1} · {fmtDay(d)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Time (optional)</Label>
              <Input data-testid="itinerary-time-input" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Place (optional)</Label>
            <Input data-testid="itinerary-place-input" placeholder="Chapora Fort, Vagator" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea data-testid="itinerary-notes-input" placeholder="Carry water, leave by 5am" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl" />
          </div>
          <Button data-testid="itinerary-submit-btn" onClick={submit} disabled={saving} className="w-full rounded-full bg-[#FF5A36] hover:bg-[#E64322] h-11">
            {saving ? "Saving…" : item ? "Save changes" : "Add plan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TripItinerary({ trip, userId, isOrganizer, onLogExpense }) {
  const [items, setItems] = useState([]);
  const [dialog, setDialog] = useState(null);

  const load = useCallback(() => {
    api.get(`/trips/${trip.id}/itinerary`).then((r) => setItems(r.data)).catch(() => {});
  }, [trip.id]);
  useEffect(() => { load(); }, [load]);

  const del = async (item) => {
    try {
      await api.delete(`/trips/${trip.id}/itinerary/${item.id}`);
      toast.success("Removed from the plan");
      load();
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const days = dayList(trip.start_date, trip.end_date);
  const extraDates = [...new Set(items.map((i) => i.date))].filter((d) => !days.includes(d)).sort();
  const allDays = [...days, ...extraDates];
  const byDate = {};
  items.forEach((i) => { (byDate[i.date] = byDate[i.date] || []).push(i); });

  return (
    <div data-testid="trip-itinerary">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">Day-by-day plan everyone in the trip can build together.</p>
        <Button data-testid="itinerary-add-btn" onClick={() => setDialog({ item: null })} size="sm" className="rounded-full bg-[#0A2540] hover:bg-[#123B66]">
          <Plus size={15} className="mr-1" /> Add plan
        </Button>
      </div>

      <div className="space-y-8">
        {allDays.map((date, di) => {
          const dayItems = byDate[date] || [];
          return (
            <div key={date} data-testid={`itinerary-day-${date}`}>
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-display text-lg font-bold">{di < days.length ? `Day ${di + 1}` : "Extra"}</span>
                <span className="text-sm text-muted-foreground">{fmtDay(date)}</span>
                <button data-testid={`itinerary-day-add-${date}`} onClick={() => setDialog({ item: null, date })} className="text-xs font-semibold text-[#FF5A36] hover:underline ml-auto">+ add here</button>
              </div>
              {dayItems.length === 0 ? (
                <p className="text-sm text-muted-foreground/70 border border-dashed border-[#E5E4E0] rounded-xl px-4 py-3">Nothing planned yet.</p>
              ) : (
                <div className="space-y-2 border-l-2 border-[#E5E4E0] pl-4 ml-1">
                  {dayItems.map((it) => (
                    <div key={it.id} data-testid="itinerary-item" className="bg-white border border-[#E5E4E0] rounded-2xl p-4 flex gap-3 relative group">
                      <span className="absolute -left-[23px] top-5 h-3 w-3 rounded-full bg-[#FF5A36] border-2 border-white" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {it.time && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0A2540] bg-[#0A2540]/10 rounded-full px-2 py-0.5">
                              <Clock size={11} /> {it.time}
                            </span>
                          )}
                          <p className="font-semibold">{it.title}</p>
                        </div>
                        {it.place && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin size={13} className="text-[#FF5A36] shrink-0" /> {it.place}
                          </p>
                        )}
                        {it.notes && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{it.notes}</p>}
                        <p className="text-[11px] text-muted-foreground/70 mt-1.5">added by {it.member_name}</p>
                      </div>
                      <div className="flex gap-1 shrink-0 self-start">
                        <button data-testid="itinerary-expense-btn" onClick={() => onLogExpense(it)} title="Log an expense for this plan" className="h-7 px-2 rounded-full hover:bg-[#FFF1EC] flex items-center gap-1 text-[11px] font-semibold text-[#FF5A36] transition-colors" aria-label="Log expense for this plan">
                          <Receipt size={13} weight="duotone" /> Log expense
                        </button>
                        {(it.created_by === userId || isOrganizer) && (
                          <>
                            <button data-testid="itinerary-edit-btn" onClick={() => setDialog({ item: it })} className="h-7 w-7 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground transition-colors" aria-label="Edit plan">
                              <PencilSimple size={13} />
                            </button>
                            <button data-testid="itinerary-delete-btn" onClick={() => del(it)} className="h-7 w-7 rounded-full hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-muted-foreground transition-colors" aria-label="Delete plan">
                              <Trash size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center mt-4 text-muted-foreground text-sm flex items-center justify-center gap-2">
          <CalendarBlank size={16} weight="duotone" className="text-[#FF5A36]" /> Start with day 1 — where's the crew headed first?
        </div>
      )}

      {dialog && (
        <ItineraryDialog
          key={dialog.item?.id || `new-${dialog.date || "any"}`}
          trip={trip}
          days={allDays}
          item={dialog.item}
          defaultDate={dialog.date}
          onClose={() => setDialog(null)}
          onDone={() => { setDialog(null); load(); }}
        />
      )}
    </div>
  );
}
