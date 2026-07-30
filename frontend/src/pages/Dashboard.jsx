import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api, { inr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AirplaneTilt, Train, Buildings, UsersThree, ArrowRight, Ticket, MapTrifold } from "@phosphor-icons/react";

const typeIcon = { flight: AirplaneTilt, train: Train, hotel: Buildings };

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    api.get("/bookings").then((r) => setBookings(r.data)).catch(() => {});
    api.get("/trips").then((r) => setTrips(r.data)).catch(() => {});
    api.get("/destinations").then((r) => setDestinations(r.data)).catch(() => {});
  }, []);

  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const firstName = (user?.name || "traveller").split(" ")[0];
  const activeTrip = trips[0];

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="uppercase tracking-[0.25em] text-xs font-semibold text-[#FF5A36] mb-2">Your travel HQ</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold" data-testid="dashboard-welcome">
          Welcome back, {firstName}.
        </h1>
        <p className="text-muted-foreground mt-2">
          {activeTrip ? <>Continue planning your <Link to={`/trips/${activeTrip.id}`} className="text-[#0A2540] font-semibold hover:underline">{activeTrip.destination} trip</Link>.</> : "Where are we off to next?"}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
        {[
          { label: "Book a journey", to: "/book", icon: AirplaneTilt, testid: "quick-book" },
          { label: "Plan group trip", to: "/trips", icon: UsersThree, testid: "quick-trips" },
          { label: "Explore destinations", to: "/explore", icon: MapTrifold, testid: "quick-explore" },
          { label: "My bookings", to: "/bookings", icon: Ticket, testid: "quick-bookings" },
        ].map((q, i) => (
          <motion.div key={q.to + q.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
            <Link to={q.to} data-testid={`dashboard-${q.testid}`} className="group bg-white border border-[#E5E4E0] rounded-2xl p-5 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-1 transition-[box-shadow,transform] duration-300 h-full">
              <q.icon size={28} weight="duotone" className="text-[#FF5A36]" />
              <span className="font-semibold text-sm">{q.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mt-12">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold">Upcoming journeys</h2>
            <Link to="/bookings" className="text-sm text-[#0A2540] font-semibold hover:underline">View all</Link>
          </div>
          {confirmed.length === 0 ? (
            <div className="bg-white border border-dashed border-[#E5E4E0] rounded-2xl p-10 text-center">
              <p className="text-muted-foreground text-sm">No confirmed bookings yet.</p>
              <Button asChild data-testid="dashboard-empty-book-btn" className="mt-4 rounded-full bg-[#FF5A36] hover:bg-[#E64322]">
                <Link to="/book">Search flights, trains & hotels <ArrowRight size={16} className="ml-1" /></Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {confirmed.slice(0, 3).map((b) => {
                const Icon = typeIcon[b.type] || AirplaneTilt;
                return (
                  <Link key={b.id} to={`/ticket/${b.id}`} data-testid="dashboard-booking-card" className="bg-white border border-[#E5E4E0] rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-shadow block">
                    <div className="h-12 w-12 rounded-xl bg-[#FFF1EC] flex items-center justify-center shrink-0">
                      <Icon size={24} weight="duotone" className="text-[#FF5A36]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{b.type === "hotel" ? b.item.name : `${b.origin} → ${b.destination}`}</p>
                      <p className="text-sm text-muted-foreground">{b.travel_date} · PNR {b.pnr}</p>
                    </div>
                    <span className="font-bold">{inr(b.amount)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold">Your trips</h2>
            <Link to="/trips" className="text-sm text-[#0A2540] font-semibold hover:underline">View all</Link>
          </div>
          {trips.length === 0 ? (
            <div className="bg-[#0A2540] text-white rounded-2xl p-10 relative overflow-hidden grain">
              <UsersThree size={32} weight="duotone" className="text-[#FFB49B]" />
              <p className="font-display text-xl font-bold mt-3">Travelling with friends?</p>
              <p className="text-white/75 text-sm mt-1">Create a travel plan: shared budget, split expenses, zero awkward math.</p>
              <Button asChild data-testid="dashboard-empty-trip-btn" className="mt-5 rounded-full bg-[#FF5A36] hover:bg-[#E64322]">
                <Link to="/trips">Create a trip</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {trips.slice(0, 3).map((t) => (
                <Link key={t.id} to={`/trips/${t.id}`} data-testid="dashboard-trip-card" className="bg-white border border-[#E5E4E0] rounded-2xl p-5 hover:shadow-md transition-shadow block">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{t.name}</p>
                    <Badge variant="outline" className="border-[#0A2540] text-[#0A2540]">{t.members.length} members</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{t.destination} · {t.start_date} → {t.end_date}</p>
                  <p className="text-sm mt-2">Budget <span className="font-bold">{inr(t.budget_total)}</span></p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-bold mb-4">Keep exploring</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {destinations.map((d) => (
            <Link key={d.slug} to={`/destinations/${d.slug}`} data-testid={`dashboard-destination-${d.slug}`} className="group relative rounded-xl overflow-hidden h-32">
              <img src={d.image} alt={d.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <p className="absolute bottom-2.5 left-3 text-white font-display font-bold">{d.name}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
