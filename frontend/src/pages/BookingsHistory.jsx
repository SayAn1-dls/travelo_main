import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiError, inr } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AirplaneTilt, Train, Buildings, ArrowRight } from "@phosphor-icons/react";
import { toast } from "sonner";

const typeIcon = { flight: AirplaneTilt, train: Train, hotel: Buildings };
const statusStyle = {
  confirmed: "bg-emerald-100 text-emerald-800",
  pending_payment: "bg-amber-100 text-amber-800",
  cancelled: "bg-red-100 text-red-700",
};

export default function BookingsHistory() {
  const [bookings, setBookings] = useState(null);

  useEffect(() => {
    api.get("/bookings").then((r) => setBookings(r.data)).catch(() => setBookings([]));
  }, []);

  const payNow = async (b) => {
    try {
      const { data } = await api.post("/payments/checkout", { purpose: "booking", booking_id: b.id, origin_url: window.location.origin });
      window.location.href = data.checkout_url;
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
      <p className="uppercase tracking-[0.25em] text-xs font-semibold text-[#E25822] mb-2">Trip history</p>
      <h1 className="font-display text-4xl sm:text-5xl font-bold">My bookings</h1>

      {bookings === null ? (
        <p className="mt-10 text-muted-foreground">Loading…</p>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-dashed border-[#EAE3D9] rounded-2xl p-14 text-center mt-10">
          <p className="text-muted-foreground">Your journeys will show up here.</p>
          <Button asChild data-testid="bookings-empty-cta" className="mt-4 rounded-full bg-[#E25822] hover:bg-[#C84B1A]">
            <Link to="/book">Book your first journey <ArrowRight size={16} className="ml-1" /></Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4 mt-10">
          {bookings.map((b) => {
            const Icon = typeIcon[b.type] || AirplaneTilt;
            return (
              <div key={b.id} data-testid="booking-history-card" className="bg-white border border-[#EAE3D9] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-[#FDF3EC] flex items-center justify-center shrink-0">
                  <Icon size={24} weight="duotone" className="text-[#E25822]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{b.type === "hotel" ? b.item.name : `${b.origin} → ${b.destination}`}</p>
                    <Badge className={`${statusStyle[b.status] || ""} border-0`} data-testid="booking-status-badge">{b.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{b.travel_date} · PNR {b.pnr} · {b.passengers.length} traveller(s)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl font-bold">{inr(b.amount)}</span>
                  {b.status === "confirmed" ? (
                    <Button asChild data-testid="view-ticket-btn" variant="outline" className="rounded-full">
                      <Link to={`/ticket/${b.id}`}>E-ticket</Link>
                    </Button>
                  ) : b.status === "pending_payment" ? (
                    <Button data-testid="complete-payment-btn" onClick={() => payNow(b)} className="rounded-full bg-[#E25822] hover:bg-[#C84B1A]">Complete payment</Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
