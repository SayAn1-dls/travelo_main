import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AirplaneTilt, MapPin, Wallet, Users, Lightning } from "@phosphor-icons/react";

const DESTINATIONS = [
  { name: "Goa", tag: "Beach bum energy" },
  { name: "Manali", tag: "Snow, chai, suffer" },
  { name: "Bali", tag: "10k followers guaranteed" },
  { name: "Bangkok", tag: "Street food + chaos" },
  { name: "Istanbul", tag: "History + confusion" },
  { name: "Tokyo", tag: "Broke but happy" },
];

const MARQUEE_TEXT = "\u2708 TRAVELO \u00b7 BOOK IT \u00b7 SPLIT IT \u00b7 FLEX IT \u00b7 TRAVELO \u00b7 BOOK IT \u00b7 SPLIT IT \u00b7 FLEX IT \u00b7 TRAVELO \u00b7 BOOK IT \u00b7 SPLIT IT \u00b7 FLEX IT \u00b7 ";

export default function Landing() {
  return (
    <div style={{ background: "#080808", minHeight: "100vh", overflow: "hidden" }}>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "24px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #111111", background: "#080808" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "#FF4D00", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-10deg)" }}>
            <AirplaneTilt size={22} weight="fill" color="white" />
          </div>
          <span style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 26, color: "white", letterSpacing: "0.05em" }}>TRAVELO<span style={{ color: "#FF4D00" }}>.</span></span>
        </div>
        <Link to="/auth"><button className="btn-fire" style={{ fontSize: 13, padding: "12px 28px" }}>GET IN</button></Link>
      </nav>

      <section style={{ paddingTop: 160, paddingBottom: 80, paddingLeft: 48, paddingRight: 48, maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <span className="badge-fire"><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF4D00", display: "inline-block" }} /> v24 \u00b7 Built different</span>
        </div>
        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: "clamp(72px, 12vw, 180px)", lineHeight: 0.85, color: "white", margin: "0 0 32px", textTransform: "uppercase" }}>
          TRIPS HIT<br /><span style={{ color: "#FF4D00" }}>DIFFERENT</span><br /><span style={{ color: "#333333" }}>WITH TRAVELO.</span>
        </motion.h1>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 40 }}>
          <div style={{ maxWidth: 480 }}>
            <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 20, color: "#888888", lineHeight: 1.6, margin: "0 0 32px", fontWeight: 500 }}>Plan group trips, split expenses without losing friends, and let AI handle the boring logistics. You just show up with a vibe.</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <Link to="/auth"><button className="btn-fire">START EXPLORING</button></Link>
              <Link to="/auth"><button className="btn-ghost">WATCH HOW</button></Link>
            </div>
          </div>
          <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 28, color: "#FF4D00", transform: "rotate(-2deg)", maxWidth: 260, lineHeight: 1.3 }}>"Because someone's gotta plan it and it ain't gonna be Raj."</p>
        </div>
      </section>

      <div style={{ background: "#FF4D00", padding: "14px 0", overflow: "hidden", marginBottom: 80 }}>
        <div style={{ display: "flex", whiteSpace: "nowrap" }} className="animate-marquee">
          <span style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 16, color: "white", letterSpacing: "0.1em" }}>{MARQUEE_TEXT}</span>
          <span style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 16, color: "white", letterSpacing: "0.1em" }}>{MARQUEE_TEXT}</span>
        </div>
      </div>

      <section style={{ padding: "0 48px 100px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {[
            { icon: Wallet, color: "#FF4D00", title: "SPLIT OR CRY", desc: "Min-cash-flow algorithm so you don't Venmo your bestie 47 times.", quip: '"\u20b9340 from Rohan. Again."' },
            { icon: MapPin, color: "#00E5FF", title: "PLAN THE CHAOS", desc: "AI-powered itineraries, booking links, and maps. All in one place.", quip: '"Day 3: somehow we\'re in Hampi."' },
            { icon: Users, color: "#F5FF50", title: "SQUAD UP", desc: "Add your whole group. Everyone sees the budget. No excuses.", quip: '"Priya said she\'s coming. We\'ll see."' },
            { icon: Lightning, color: "#FF2D6B", title: "BOOK FAST", desc: "Direct links to flights, trains, and hotels. No middleman.", quip: '"You snooze, Raj gets the window seat."' },
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="travel-card" style={{ padding: 32 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <f.icon size={28} color={f.color} weight="bold" />
              </div>
              <h3 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 28, color: "white", margin: "0 0 12px", letterSpacing: "0.05em" }}>{f.title}</h3>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 15, color: "#777777", lineHeight: 1.6, margin: "0 0 16px" }}>{f.desc}</p>
              <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 18, color: f.color, margin: 0 }}>{f.quip}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ padding: "0 48px 100px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: 40, display: "flex", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
          <h2 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: "clamp(48px, 6vw, 80px)", color: "white", lineHeight: 0.9, margin: 0 }}>WHERE TO<br /><span style={{ color: "#FF4D00" }}>NEXT?</span></h2>
          <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 22, color: "#555555", marginBottom: 4 }}>"Seriously though. Pick one."</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {DESTINATIONS.map((d, i) => (
            <Link to="/auth" key={i} style={{ textDecoration: "none" }}>
              <div style={{ background: "#111111", border: "2px solid #1E1E1E", borderRadius: 12, padding: "18px 24px", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#FF4D00"; e.currentTarget.style.transform = "translateY(-3px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "#1E1E1E"; e.currentTarget.style.transform = "none"; }}>
                <p style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 20, color: "white", margin: "0 0 4px", letterSpacing: "0.05em" }}>{d.name}</p>
                <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 16, color: "#FF4D00", margin: 0 }}>{d.tag}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ background: "#FF4D00", padding: "80px 48px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: "clamp(48px, 7vw, 100px)", color: "white", lineHeight: 0.9, margin: "0 0 24px" }}>STOP PLANNING.<br />START GOING.</h2>
        <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 28, color: "rgba(255,255,255,0.7)", marginBottom: 40 }}>"Your group chat has 47 unread messages about Goa. This fixes that."</p>
        <Link to="/auth">
          <button style={{ background: "white", color: "#FF4D00", border: "2px solid white", borderRadius: 8, padding: "20px 60px", fontFamily: "Anton, Impact, sans-serif", fontSize: 22, letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "white"; }} onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#FF4D00"; }}>LET'S GO \u2192</button>
        </Link>
      </section>

      <footer style={{ padding: "32px 48px", borderTop: "1px solid #111111", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <span style={{ fontFamily: "Anton, sans-serif", fontSize: 18, color: "#333333" }}>TRAVELO.</span>
        <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 16, color: "#333333", margin: 0 }}>"Built with spite and a cancelled Goa trip."</p>
      </footer>
    </div>
  );
}
