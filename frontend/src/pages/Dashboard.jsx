import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api, { inr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AirplaneTilt, Train, Buildings, UsersThree, ArrowRight, Ticket, MapTrifold, Lightning } from "@phosphor-icons/react";

const typeIcon = { flight: AirplaneTilt, train: Train, hotel: Buildings };

const quickActions = [
  { label: "Book a Journey", to: "/book",     icon: AirplaneTilt, testid: "quick-book",     accent: "#FF4500", bg: "from-orange-500/20 to-red-500/5" },
  { label: "Plan Group Trip", to: "/trips",    icon: UsersThree,   testid: "quick-trips",    accent: "#00F5D4", bg: "from-cyan-500/20 to-teal-500/5" },
  { label: "Explore Spots",   to: "/explore",  icon: MapTrifold,   testid: "quick-explore",  accent: "#8338EC", bg: "from-purple-500/20 to-indigo-500/5" },
  { label: "My Bookings",     to: "/bookings", icon: Ticket,       testid: "quick-bookings", accent: "#FFE600", bg: "from-yellow-500/20 to-amber-500/5" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings]         = useState([]);
  const [trips, setTrips]               = useState([]);
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    api.get("/bookings").then((r) => setBookings(r.data)).catch(() => {});
    api.get("/trips").then((r) => setTrips(r.data)).catch(() => {});
    api.get("/destinations").then((r) => setDestinations(r.data)).catch(() => {});
  }, []);

  const confirmed  = bookings.filter((b) => b.status === "confirmed");
  const firstName  = (user?.name || "Traveller").split(" ")[0];
  const activeTrip = trips[0];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] p-8 sm:p-12 mb-10"
          style={{ background: "linear-gradient(135deg, #141414 0%, #1e1e1e 100%)", border: "1px solid rgba(255,69,0,0.15)" }}
        >
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #FF4500, transparent)" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Lightning weight="fill" size={16} className="text-[#FFE600]" />
              <p className="text-[#FF4500] font-bold uppercase tracking-[0.25em] text-xs">Your Travel HQ</p>
            </div>
            <h1 className="font-bebas text-[3.5rem] sm:text-[5rem] text-white leading-none tracking-wider mb-2" data-testid="dashboard-welcome">
              WELCOME BACK, <span className="text-gradient-flame">{firstName.toUpperCase()}.</span>
            </h1>
            <p className="text-white/50 font-medium text-base">
              {activeTrip ? (
                <>Continue planning your <Link to={`/trips/${activeTrip.id}`} className="text-[#FF4500] font-bold hover:underline no-underline">{activeTrip.destination} trip</Link>.</>
              ) : "Where are we off to next?"}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {quickActions.map((q, i) => (
            <motion.div key={q.to} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
              <Link to={q.to} data-testid={`dashboard-${q.testid}`}
                className="group relative overflow-hidden rounded-[1.5rem] p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-2 block no-underline"
                style={{ background: "#141414", border: "1px solid #222" }}
                onMouseEnter={(e) => { e.currentTarget.style.border = `1px solid ${q.accent}44`; e.currentTarget.style.boxShadow = `0 8px 30px ${q.accent}15`; }}
                onMouseLeave={(e) => { e.currentTarget.style.border = "1px solid #222"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${q.bg} opacity-60`} />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform" style={{ background: `${q.accent}15` }}>
                    <q.icon size={24} weight="duotone" style={{ color: q.accent }} />
                  </div>
                  <span className="font-bold text-sm text-white/90 block leading-snug">{q.label}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-12">
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bebas text-[2rem] text-white tracking-wider">UPCOMING JOURNEYS</h2>
              <Link to="/bookings" className="text-[#FF4500] text-sm font-bold hover:underline no-underline">View all \u2192</Link>
            </div>
            {confirmed.length === 0 ? (
              <div className="rounded-[1.5rem] p-10 text-center" style={{ background: "#141414", border: "1px dashed #333" }}>
                <p className="text-white/30 text-sm font-medium mb-4">No confirmed bookings yet.</p>
                <Link to="/book" data-testid="dashboard-empty-book-btn">
                  <button className="btn-flame text-sm py-3 px-8">Search & Book \u2192</button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {confirmed.slice(0, 3).map((b) => {
                  const Icon = typeIcon[b.type] || AirplaneTilt;
                  return (
                    <Link key={b.id} to={`/ticket/${b.id}`} data-testid="dashboard-booking-card"
                      className="flex items-center gap-4 p-5 rounded-[1.25rem] transition-all hover:-translate-y-1 block no-underline"
                      style={{ background: "#141414", border: "1px solid #222" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#FF450044"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#222"; }}
                    >
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,69,0,0.12)" }}>
                        <Icon size={24} weight="duotone" className="text-[#FF4500]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate text-sm">{b.type === "hotel" ? b.item.name : `${b.origin} \u2192 ${b.destination}`}</p>
                        <p className="text-white/40 text-xs mt-0.5">{b.travel_date} \u00b7 PNR {b.pnr}</p>
                      </div>
                      <span className="font-black text-[#FF4500] text-sm">{inr(b.amount)}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bebas text-[2rem] text-white tracking-wider">YOUR TRIPS</h2>
              <Link to="/trips" className="text-[#FF4500] text-sm font-bold hover:underline no-underline">View all \u2192</Link>
            </div>
            {trips.length === 0 ? (
              <div className="relative overflow-hidden rounded-[1.5rem] p-10" style={{ background: "linear-gradient(135deg, #141414, #1a1a2e)", border: "1px solid rgba(131,56,236,0.3)" }}>
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #8338EC, transparent)" }} />
                <div className="relative z-10">
                  <UsersThree size={32} weight="duotone" className="text-[#8338EC] mb-4" />
                  <p className="font-bebas text-[1.8rem] text-white tracking-wider mb-2">TRAVEL WITH YOUR SQUAD</p>
                  <p className="text-white/50 text-sm font-medium mb-6 leading-relaxed">Shared budget, auto split expenses, zero awkward math.</p>
                  <Link to="/trips" data-testid="dashboard-empty-trip-btn">
                    <button className="btn-flame text-sm py-3 px-8">Create a Trip \u2192</button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {trips.slice(0, 3).map((t) => (
                  <Link key={t.id} to={`/trips/${t.id}`} data-testid="dashboard-trip-card"
                    className="block p-5 rounded-[1.25rem] transition-all hover:-translate-y-1 no-underline"
                    style={{ background: "#141414", border: "1px solid #222" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#8338EC44"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#222"; }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-white text-sm">{t.name}</p>
                      <Badge variant="outline" className="border-white/20 text-white/50 text-[10px]">{t.members.length} members</Badge>
                    </div>
                    <p className="text-white/40 text-xs">{t.destination} \u00b7 {t.start_date} \u2192 {t.end_date}</p>
                    <p className="text-white/60 text-sm mt-2">Budget <span className="font-black text-[#FFE600]">{inr(t.budget_total)}</span></p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {destinations.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bebas text-[2rem] text-white tracking-wider">KEEP EXPLORING</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {destinations.map((d) => (
                <Link key={d.slug} to={`/destinations/${d.slug}`} data-testid={`dashboard-destination-${d.slug}`}
                  className="group relative rounded-[1.25rem] overflow-hidden h-32 block no-underline"
                >
                  <img src={d.image} alt={d.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-60 saturate-125" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute inset-0 border-2 border-[#FF4500] rounded-[1.25rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="absolute bottom-3 left-3 font-bebas text-lg text-white tracking-wider">{d.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
