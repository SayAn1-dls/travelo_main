import { AirplaneTilt, Train, Buildings, ArrowSquareOut, Warning } from "@phosphor-icons/react";

const LINKS = [
  {
    type: "FLIGHTS",
    icon: AirplaneTilt,
    color: "#FF4D00",
    quip: '"Because 3am bus isn\'t the vibe."',
    portals: [
      { name: "IndiGo", url: "https://www.goindigo.in", note: "Budi dadi ki favourite" },
      { name: "Air India", url: "https://www.airindia.in", note: "For when budget bhi nahi banta" },
      { name: "MakeMyTrip", url: "https://www.makemytrip.com/flights", note: "Comparison king" },
      { name: "Skyscanner", url: "https://www.skyscanner.co.in", note: "Go full flex" },
    ],
  },
  {
    type: "HOTELS & STAYS",
    icon: Buildings,
    color: "#00E5FF",
    quip: '"Hostel bunk or penthouse — your call."',
    portals: [
      { name: "Booking.com", url: "https://www.booking.com", note: "Widest inventory" },
      { name: "Airbnb", url: "https://www.airbnb.co.in", note: "Local experience" },
      { name: "OYO Rooms", url: "https://www.oyorooms.com", note: "Budget warrior" },
      { name: "Goibibo", url: "https://www.goibibo.com/hotels", note: "Indian getaways" },
    ],
  },
  {
    type: "TRAINS",
    icon: Train,
    color: "#F5FF50",
    quip: '"Sir, ticket confirm hai? Sir??"',
    portals: [
      { name: "IRCTC", url: "https://www.irctc.co.in", note: "The government's mess" },
      { name: "RailYatri", url: "https://www.railyatri.in", note: "PNR status anxiety" },
      { name: "Confirmtkt", url: "https://www.confirmtkt.com", note: "Waitlist survival guide" },
    ],
  },
];

export default function BookingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#080808", paddingTop: 88, paddingBottom: 80 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>
        <header style={{ paddingTop: 56, marginBottom: 16 }}>
          <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 10, letterSpacing: "0.3em", color: "#444444", textTransform: "uppercase", display: "block", marginBottom: 12 }}>MISSION LOGISTICS — BOOK NOW OR CRY LATER</span>
          <h1 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: "clamp(56px, 8vw, 110px)", lineHeight: 0.85, color: "white", margin: 0 }}>SECURE<br /><span style={{ color: "#FF4D00" }}>THE SEAT.</span></h1>
        </header>
        <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 26, color: "#FF4D00", margin: "20px 0 48px" }}>"You said you'll book tomorrow. It's been 3 weeks, Sayan."</p>
        <div style={{ background: "rgba(245,255,80,0.05)", border: "1.5px solid rgba(245,255,80,0.15)", borderRadius: 10, padding: "14px 20px", marginBottom: 48, display: "flex", alignItems: "center", gap: 12 }}>
          <Warning size={20} color="#F5FF50" weight="bold" />
          <p style={{ fontFamily: "Space Grotesk", fontWeight: 600, fontSize: 13, color: "#888888", margin: 0 }}>These are direct links. No middleman. No data selling. Just you, your card, and the airport drop anxiety.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
          {LINKS.map((section, si) => (
            <div key={si}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <section.icon size={32} color={section.color} weight="bold" />
                <h2 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 40, color: "white", margin: 0, letterSpacing: "0.05em" }}>{section.type}</h2>
                <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 20, color: section.color, margin: 0, marginLeft: 8 }}>{section.quip}</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {section.portals.map((p, pi) => (
                  <a key={pi} href={p.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                    <div style={{ background: "#0F0F0F", border: "2px solid #1A1A1A", borderRadius: 14, padding: "24px 20px", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = section.color; e.currentTarget.style.transform = "translateY(-4px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#1A1A1A"; e.currentTarget.style.transform = "none"; }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <h3 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 22, color: "white", margin: 0, letterSpacing: "0.05em" }}>{p.name}</h3>
                        <ArrowSquareOut size={18} color={section.color} />
                      </div>
                      <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 16, color: "#555555", margin: 0 }}>{p.note}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 64, background: "#111111", border: "2px solid #1E1E1E", borderRadius: 16, padding: "32px 36px" }}>
          <h3 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 32, color: "#FF4D00", margin: "0 0 12px" }}>PRO TIP</h3>
          <p style={{ fontFamily: "Space Grotesk", fontSize: 16, color: "#666666", lineHeight: 1.6, margin: "0 0 12px" }}>Book flights Tuesday/Wednesday at midnight for best prices. Hotels — book 2 weeks out for mountain trips, 3 days before for city stays (last-minute drops).</p>
          <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 20, color: "#444444", margin: 0 }}>"This advice is free. The regret isn't."</p>
        </div>
      </div>
    </div>
  );
}
