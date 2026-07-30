import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { inr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AirplaneTilt, Train, Buildings, DownloadSimple, MapTrifold } from "@phosphor-icons/react";

const typeIcon = { flight: AirplaneTilt, train: Train, hotel: Buildings };
const DEST_SLUGS = ["goa", "bali", "rishikesh", "jaipur", "manali", "kochi"];

export default function TicketPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/bookings/${id}`).then((r) => setBooking(r.data)).catch(() => setError(true));
  }, [id]);

  if (error) return <div className="max-w-2xl mx-auto px-5 py-20 text-center text-muted-foreground">Booking not found.</div>;
  if (!booking) return <div className="max-w-2xl mx-auto px-5 py-20 text-center text-muted-foreground">Loading…</div>;

  const Icon = typeIcon[booking.type] || AirplaneTilt;
  const destSlug = DEST_SLUGS.find((s) => booking.destination?.toLowerCase().includes(s));

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
      <div className="flex items-center justify-between mb-8 print:hidden">
        <h1 className="font-display text-3xl sm:text-4xl font-bold">Your e-ticket</h1>
        <Button data-testid="download-ticket-btn" onClick={() => window.print()} variant="outline" className="rounded-full">
          <DownloadSimple size={18} className="mr-2" /> Download PDF
        </Button>
      </div>

      <div id="printable-ticket" data-testid="eticket-card" className="bg-white rounded-2xl overflow-hidden shadow-lg border border-[#E5E4E0]">
        <div className="bg-[#0A2540] text-white px-7 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AirplaneTilt size={22} weight="duotone" />
            <span className="font-display font-bold text-xl">Travelo</span>
          </div>
          <Badge className={`border-0 ${booking.status === "confirmed" ? "bg-emerald-400 text-emerald-950" : "bg-amber-300 text-amber-950"}`}>
            {booking.status === "confirmed" ? "CONFIRMED" : booking.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>

        <div className="px-7 py-6">
          <div className="flex items-center gap-3">
            <Icon size={30} weight="duotone" className="text-[#FF5A36]" />
            <div>
              <p className="font-display text-xl font-bold">
                {booking.type === "hotel" ? booking.item.name : `${booking.origin} → ${booking.destination}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {booking.type === "hotel"
                  ? `${booking.item.room_type} · ${booking.nights} night(s) · ${booking.rooms} room(s)`
                  : `${booking.item.airline || booking.item.train_name} · ${booking.item.flight_no || "#" + booking.item.train_no} · ${booking.item.depart} → ${booking.item.arrive}`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pb-6 border-b border-dashed">
            <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground">PNR</p><p className="font-mono font-bold text-lg" data-testid="ticket-pnr">{booking.pnr}</p></div>
            <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Date</p><p className="font-semibold">{booking.travel_date}</p></div>
            <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Amount paid</p><p className="font-semibold">{inr(booking.amount)}</p></div>
          </div>

          <div className="mt-5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Travellers</p>
            {booking.passengers.map((p, i) => (
              <p key={i} className="text-sm font-medium">{i + 1}. {p.name} {p.age ? `(${p.age})` : ""}</p>
            ))}
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div className="text-xs text-muted-foreground">
              <p>Contact: {booking.contact_email}</p>
              <p>Booked via Travelo · Mock inventory (sandbox)</p>
            </div>
            <div className="flex gap-[2px]">
              {booking.pnr.split("").map((c, i) => (
                <div key={i} className="w-1 bg-[#1A1A1A]" style={{ height: `${20 + (c.charCodeAt(0) % 22)}px` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {destSlug && (
        <div className="mt-8 bg-[#FFF1EC] border border-[#E5E4E0] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div>
            <p className="font-display text-lg font-bold flex items-center gap-2"><MapTrifold size={20} weight="duotone" className="text-[#FF5A36]" /> Getting around {booking.destination}</p>
            <p className="text-sm text-muted-foreground mt-1">Local buses, cabs, scooter & car rentals near your destination.</p>
          </div>
          <Button asChild data-testid="ticket-destination-hub-btn" className="rounded-full bg-[#0A2540] hover:bg-[#123B66]">
            <Link to={`/destinations/${destSlug}`}>Open Destination Hub</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
