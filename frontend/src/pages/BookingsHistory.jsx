import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiError, inr } from "@/lib/api";
import { AirplaneTilt, Train, Buildings, ArrowRight, Receipt } from "@phosphor-icons/react";
import { toast } from "sonner";

const typeIcon = { flight: AirplaneTilt, train: Train, hotel: Buildings };
const typeColor = { flight: "#FF4D00", train: "#F5FF50", hotel: "#00E5FF" };

const statusStyle = {
  confirmed: { bg: "rgba(74,222,128,0.08)", color: "#4ade80", border: "rgba(74,222,128,0.2)" },
  pending_payment: { bg: "rgba(251,191,36,0.08)", color: "#fbbf24", border: "rgba(251,191,36,0.2)" },
  cancelled: { bg: "rgba(239,68,68,0.08)", color: "#ef4444", border: "rgba(239,68,68,0.2)" },
};

export default function BookingsHistory() {
  const [bookings, setBookings] = useState(null);

  useEffect(() => {
    api.get("/bookings").then(r => setBookings(r.data)).catch(() => setBookings([]));
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
    <div style={{ minHeight: "100vh", background: "#080808", paddingTop: 88, paddingBottom: 80 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 32px" }}>
        <header style={{ paddingTop: 56, marginBottom: 16 }}>
          <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 10, letterSpacing: "0.3em", color: "#444444", textTransform: "uppercase", display: "block", marginBottom: 12 }}>FINANCIAL EVIDENCE</span>
          <h1 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: "clamp(52px, 7vw, 100px)", lineHeight: 0.85, color: "white", margin: 0 }}>WHERE DID<br /><span style={{ color: "#FF4D00" }}>THE MONEY GO?</span></h1>
        </header>
        <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 24, color: "#FF4D00", margin: "20px 0 48px" }}>"Spoiler: Goa ate it. All of it."</p>
        {bookings === null ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "32px 0" }}>
            <div style={{ width: 24, height: 24, border: "2px solid #FF4D00", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontFamily: "Space Grotesk", fontWeight: 600, color: "#555555" }}>Loading receipts...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ background: "#0F0F0F", border: "2px dashed #222222", borderRadius: 16, padding: "60px 48px", textAlign: "center" }}>
            <Receipt size={48} color="#333333" weight="thin" style={{ marginBottom: 20 }} />
            <h2 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 36, color: "#333333", margin: "0 0 12px" }}>NO RECEIPTS YET</h2>
            <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 20, color: "#444444", marginBottom: 32 }}>"The wallet is untouched. For now."</p>
            <Link to="/bookings"><button className="btn-fire" style={{ fontSize: 14, padding: "14px 32px" }}>BOOK SOMETHING <ArrowRight size={16} style={{ display: "inline" }} /></button></Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {bookings.map((b) => {
              const Icon = typeIcon[b.type] || AirplaneTilt;
              const color = typeColor[b.type] || "#FF4D00";
              const s = statusStyle[b.status] || statusStyle.pending_payment;
              return (
                <div key={b.id} style={{ background: "#0F0F0F", border: "2px solid #1A1A1A", borderRadius: 14, padding: "24px 28px", display: "flex", alignItems: "center", gap: 20, transition: "border-color 0.15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = color} onMouseLeave={e => e.currentTarget.style.borderColor = "#1A1A1A"}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={24} color={color} weight="bold" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 20, color: "white", margin: "0 0 4px", letterSpacing: "0.05em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.title}</h3>
                    <p style={{ fontFamily: "Space Grotesk", fontSize: 13, color: "#555555", margin: 0 }}>{b.from} → {b.to} · {b.date}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 22, color: "white", margin: "0 0 6px" }}>{inr(b.amount)}</p>
                    <div style={{ display: "inline-flex", alignItems: "center", background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: "3px 10px" }}><span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 11, color: s.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>{b.status.replace("_", " ")}</span></div>
                    {b.status === "pending_payment" && (<button onClick={() => payNow(b)} style={{ display: "block", marginTop: 8, background: "#FF4D00", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", fontFamily: "Anton, sans-serif", fontSize: 12, letterSpacing: "0.1em", cursor: "pointer" }}>PAY NOW</button>)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
