import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError, inr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AirplaneTilt, Train, Buildings, Star, ArrowRight, Clock } from "@phosphor-icons/react";
import { toast } from "sonner";

export const CITY_LIST = ["Mumbai", "Delhi", "Bengaluru", "Goa", "Jaipur", "Kochi", "Dehradun", "Chennai", "Kolkata", "Hyderabad", "Bali", "Manali", "Udaipur", "Varanasi"];
const today = new Date().toISOString().split("T")[0];

const fmtDur = (m) => `${Math.floor(m / 60)}h ${m % 60}m`;

function CitySelect({ value, onChange, placeholder, testid }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger data-testid={testid} className="h-11 rounded-xl bg-white">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {CITY_LIST.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function PassengerDialog({ open, onClose, selection, form, user }) {
  const [passengers, setPassengers] = useState([{ name: user?.name || "", age: 30, gender: "other" }]);
  const [contact, setContact] = useState({ email: user?.email || "", phone: user?.phone || "" });
  const [paying, setPaying] = useState(false);
  if (!selection) return null;
  const { type, item } = selection;
  const count = type === "hotel" ? 1 : passengers.length;
  const total = type === "hotel" ? item.price_per_night * form.nights * form.rooms : item.price * passengers.length;

  const setP = (i, k, v) => setPassengers((p) => p.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const pay = async () => {
    if (passengers.some((p) => !p.name.trim())) return toast.error("Enter all traveller names");
    setPaying(true);
    try {
      const { data: booking } = await api.post("/bookings", {
        type, item,
        passengers: passengers.map((p) => ({ ...p, age: Number(p.age) || 30 })),
        contact_email: contact.email, contact_phone: contact.phone,
        origin: form.origin || null, destination: type === "hotel" ? form.city : form.destination,
        travel_date: form.date, nights: form.nights, rooms: form.rooms,
      });
      const { data: session } = await api.post("/payments/checkout", {
        purpose: "booking", booking_id: booking.id, origin_url: window.location.origin,
      });
      window.location.href = session.checkout_url;
    } catch (e) {
      toast.error(formatApiError(e));
      setPaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" data-testid="passenger-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Complete your booking</DialogTitle>
        </DialogHeader>
        <div className="bg-[#FFF1EC] rounded-xl p-4 text-sm">
          <p className="font-semibold">{type === "hotel" ? item.name : `${item.airline || item.train_name} · ${item.origin} → ${item.destination}`}</p>
          <p className="text-muted-foreground mt-0.5">
            {type === "hotel" ? `${form.nights} night(s) · ${form.rooms} room(s) · ${item.room_type}` : `${form.date} · ${item.depart} → ${item.arrive}`}
          </p>
        </div>
        {type !== "hotel" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Travellers</Label>
              <div className="flex gap-2">
                {passengers.length > 1 && <Button size="sm" variant="outline" className="rounded-full h-7" onClick={() => setPassengers((p) => p.slice(0, -1))}>−</Button>}
                {passengers.length < 6 && <Button data-testid="add-passenger-btn" size="sm" variant="outline" className="rounded-full h-7" onClick={() => setPassengers((p) => [...p, { name: "", age: 30, gender: "other" }])}>+ Add</Button>}
              </div>
            </div>
            {passengers.map((p, i) => (
              <div key={i} className="grid grid-cols-[1fr_70px] gap-2">
                <Input data-testid={`passenger-name-${i}`} placeholder={`Traveller ${i + 1} name`} value={p.name} onChange={(e) => setP(i, "name", e.target.value)} className="rounded-xl" />
                <Input data-testid={`passenger-age-${i}`} type="number" min="1" placeholder="Age" value={p.age} onChange={(e) => setP(i, "age", e.target.value)} className="rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>Primary guest</Label>
            <Input data-testid="passenger-name-0" value={passengers[0].name} onChange={(e) => setP(0, "name", e.target.value)} className="rounded-xl" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>Contact email</Label>
            <Input data-testid="contact-email-input" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input data-testid="contact-phone-input" value={contact.phone || ""} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className="rounded-xl" />
          </div>
        </div>
        <div className="flex items-center justify-between border-t pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Total ({type === "hotel" ? `${form.nights}n × ${form.rooms} room` : `${count} traveller${count > 1 ? "s" : ""}`})</p>
            <p className="font-display text-2xl font-bold" data-testid="booking-total">{inr(total)}</p>
          </div>
          <Button data-testid="pay-with-stripe-btn" onClick={pay} disabled={paying} className="rounded-full bg-[#FF5A36] hover:bg-[#E64322] h-12 px-6">
            {paying ? "Redirecting…" : "Pay securely"} <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center">Test mode — use card 4242 4242 4242 4242, any future expiry, any CVC.</p>
      </DialogContent>
    </Dialog>
  );
}

export default function BookingPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("flight");
  const [form, setForm] = useState({ origin: "", destination: "", city: "", date: today, passengers: 1, travel_class: "economy", nights: 2, rooms: 1 });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("price");
  const [selection, setSelection] = useState(null);

  const search = async () => {
    if (tab !== "hotel" && (!form.origin || !form.destination)) return toast.error("Pick origin and destination");
    if (tab === "hotel" && !form.city) return toast.error("Pick a city");
    if (tab !== "hotel" && form.origin === form.destination) return toast.error("Origin and destination must differ");
    setLoading(true);
    setResults(null);
    try {
      const { data } = await api.post("/bookings/search", {
        type: tab, origin: form.origin || null,
        destination: tab === "hotel" ? form.city : form.destination,
        date: form.date, passengers: Number(form.passengers),
        travel_class: form.travel_class, nights: Number(form.nights), rooms: Number(form.rooms),
      });
      setResults(data.results);
    } catch (e) {
      toast.error(formatApiError(e));
    }
    setLoading(false);
  };

  const sorted = results ? [...results].sort((a, b) => {
    if (sort === "price") return (a.price || a.price_per_night) - (b.price || b.price_per_night);
    if (sort === "duration") return (a.duration_mins || 0) - (b.duration_mins || 0);
    return (b.rating || 0) - (a.rating || 0);
  }) : [];

  const classOptions = tab === "flight" ? [["economy", "Economy"], ["premium_economy", "Premium Economy"], ["business", "Business"]] : [["sleeper", "Sleeper"], ["3A", "AC 3-Tier"], ["2A", "AC 2-Tier"], ["1A", "AC First"]];

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
      <p className="uppercase tracking-[0.25em] text-xs font-semibold text-[#FF5A36] mb-2">Booking engine</p>
      <h1 className="font-display text-4xl sm:text-5xl font-bold">Where to?</h1>

      <div className="bg-white border border-[#E5E4E0] rounded-2xl p-6 sm:p-8 mt-8 shadow-sm">
        <Tabs value={tab} onValueChange={(v) => { setTab(v); setResults(null); setForm((f) => ({ ...f, travel_class: v === "train" ? "sleeper" : "economy" })); }}>
          <TabsList className="rounded-full h-12 p-1 bg-[#F0EFEB]">
            <TabsTrigger data-testid="tab-flights" value="flight" className="rounded-full px-6 h-10 data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white"><AirplaneTilt size={17} className="mr-1.5" />Flights</TabsTrigger>
            <TabsTrigger data-testid="tab-trains" value="train" className="rounded-full px-6 h-10 data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white"><Train size={17} className="mr-1.5" />Trains</TabsTrigger>
            <TabsTrigger data-testid="tab-hotels" value="hotel" className="rounded-full px-6 h-10 data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-white"><Buildings size={17} className="mr-1.5" />Hotels</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {tab !== "hotel" ? (
            <>
              <div className="space-y-1.5">
                <Label>From</Label>
                <CitySelect testid="search-origin" value={form.origin} onChange={(v) => setForm({ ...form, origin: v })} placeholder="Origin" />
              </div>
              <div className="space-y-1.5">
                <Label>To</Label>
                <CitySelect testid="search-destination" value={form.destination} onChange={(v) => setForm({ ...form, destination: v })} placeholder="Destination" />
              </div>
            </>
          ) : (
            <div className="space-y-1.5 col-span-2">
              <Label>City</Label>
              <CitySelect testid="search-city" value={form.city} onChange={(v) => setForm({ ...form, city: v })} placeholder="Where are you staying?" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>{tab === "hotel" ? "Check-in" : "Date"}</Label>
            <Input data-testid="search-date" type="date" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-11 rounded-xl bg-white" />
          </div>
          {tab === "hotel" ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Nights</Label>
                <Input data-testid="search-nights" type="number" min="1" max="30" value={form.nights} onChange={(e) => setForm({ ...form, nights: e.target.value })} className="h-11 rounded-xl bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label>Rooms</Label>
                <Input data-testid="search-rooms" type="number" min="1" max="5" value={form.rooms} onChange={(e) => setForm({ ...form, rooms: e.target.value })} className="h-11 rounded-xl bg-white" />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Class</Label>
              <Select value={form.travel_class} onValueChange={(v) => setForm({ ...form, travel_class: v })}>
                <SelectTrigger data-testid="search-class" className="h-11 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>{classOptions.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </div>
        <Button data-testid="search-submit-btn" onClick={search} disabled={loading} className="mt-6 w-full md:w-auto rounded-full bg-[#FF5A36] hover:bg-[#E64322] h-12 px-10 text-base">
          {loading ? "Searching…" : "Search"}
        </Button>
      </div>

      {results && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-bold" data-testid="results-count">{results.length} options found</h2>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger data-testid="sort-select" className="w-44 rounded-full bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="price">Lowest price</SelectItem>
                {tab !== "hotel" && <SelectItem value="duration">Shortest duration</SelectItem>}
                {tab === "hotel" && <SelectItem value="rating">Best rated</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-4">
            {sorted.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}>
                {tab === "hotel" ? (
                  <div data-testid="result-card" className="bg-white border border-[#E5E4E0] rounded-2xl overflow-hidden flex flex-col sm:flex-row hover:shadow-lg transition-shadow">
                    <img src={r.image} alt={r.name} className="sm:w-56 h-40 sm:h-auto object-cover" />
                    <div className="p-5 flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <p className="font-display text-lg font-bold">{r.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><Star size={14} weight="fill" className="text-amber-500" /> {r.rating} · {r.reviews} reviews · {r.room_type}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {r.amenities.map((a) => <Badge key={a} variant="outline" className="text-[10px]">{a}</Badge>)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl font-bold">{inr(r.price_per_night)}</p>
                        <p className="text-xs text-muted-foreground">per night</p>
                        <Button data-testid="select-result-btn" onClick={() => setSelection({ type: tab, item: r })} className="mt-2 rounded-full bg-[#0A2540] hover:bg-[#123B66]">Select</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div data-testid="result-card" className="bg-white border border-[#E5E4E0] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-lg transition-shadow">
                    <div className="flex-1">
                      <p className="font-semibold">{r.airline || r.train_name} <span className="text-muted-foreground font-normal text-sm">· {r.flight_no || `#${r.train_no}`}</span></p>
                      <div className="flex items-center gap-3 mt-2">
                        <div><p className="font-display text-xl font-bold">{r.depart}</p><p className="text-xs text-muted-foreground">{r.origin_code}</p></div>
                        <div className="flex-1 flex flex-col items-center px-2">
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock size={11} />{fmtDur(r.duration_mins)}</p>
                          <div className="w-full h-px bg-[#E5E4E0] relative"><div className="absolute right-0 -top-[3px] h-1.5 w-1.5 rounded-full bg-[#FF5A36]" /></div>
                          <p className="text-[11px] text-muted-foreground">{r.stops ? `${r.stops} stop` : tab === "flight" ? "Non-stop" : `${r.seats_left} seats left`}</p>
                        </div>
                        <div><p className="font-display text-xl font-bold">{r.arrive}</p><p className="text-xs text-muted-foreground">{r.destination_code}</p></div>
                      </div>
                    </div>
                    <div className="text-right sm:border-l sm:pl-5 sm:w-40">
                      <p className="font-display text-2xl font-bold">{inr(r.price)}</p>
                      <p className="text-xs text-muted-foreground">per traveller</p>
                      <Button data-testid="select-result-btn" onClick={() => setSelection({ type: tab, item: r })} className="mt-2 rounded-full bg-[#0A2540] hover:bg-[#123B66]">Select</Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <PassengerDialog open={!!selection} onClose={() => setSelection(null)} selection={selection} form={form} user={user} />
    </div>
  );
}
