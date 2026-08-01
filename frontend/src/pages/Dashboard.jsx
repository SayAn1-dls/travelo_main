import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { AirplaneTilt, Wallet, MapPin, ChatsCircle, Lightning } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || "Wanderer";

  return (
    <div style={{ minHeight: "100vh", background: "#080808", paddingTop: 88, paddingBottom: 80 }}>
      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 32px" }}>
        <header style={{ marginBottom: 64, paddingTop: 48 }}>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.3em", color: "#444444", textTransform: "uppercase" }}>COMMAND CENTER \u00b7 TRAVELO v24</span>
          </div>
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: "clamp(56px, 8vw, 120px)", lineHeight: 0.9, color: "white", margin: "0 0 16px" }}>
            YO, <span style={{ color: "#FF4D00" }}>{firstName.toUpperCase()}!</span>
          </motion.h1>
          <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 26, color: "#555555", margin: 0 }}>"Your bags are by the door. Your itinerary is not."</p>
        </header>

        <div style={{ height: 3, background: "repeating-linear-gradient(90deg, #FF4D00 0, #FF4D00 24px, transparent 24px, transparent 42px)", marginBottom: 48, borderRadius: 2 }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 20 }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ gridColumn: "span 8", background: "#0F0F0F", border: "2px solid #1A1A1A", borderRadius: 20, padding: 40, position: "relative", overflow: "hidden", minHeight: 280 }}>
            <div style={{ position: "absolute", top: -60, right: -60, opacity: 0.04 }}><AirplaneTilt size={300} weight="thin" color="white" style={{ transform: "rotate(15deg)" }} /></div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 10, letterSpacing: "0.3em", color: "#444444", textTransform: "uppercase", display: "block", marginBottom: 12 }}>NEW MISSION</span>
              <h2 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: "clamp(40px, 4vw, 64px)", color: "white", lineHeight: 0.9, margin: "0 0 16px" }}>START AN<br /><span style={{ color: "#FF4D00" }}>EXPEDITION</span></h2>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, color: "#666666", maxWidth: 420, marginBottom: 32, lineHeight: 1.6 }}>Itineraries, money splits, AI concierge. The boring stuff is handled. You just need to pack.</p>
              <Link to="/trips"><button className="btn-fire">BUILD THE VIBE</button></Link>
            </div>
          </motion.div>

          <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: 20 }}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} style={{ background: "#0F0F0F", border: "2px solid #1A1A1A", borderRadius: 20, padding: 28, flex: 1 }}>
              <Wallet size={28} color="#00E5FF" weight="bold" />
              <p style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 42, color: "white", margin: "12px 0 4px", lineHeight: 1 }}>\u20b90</p>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#444444", textTransform: "uppercase", margin: "0 0 8px" }}>TOTAL SPENT</p>
              <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 16, color: "#444444", margin: 0 }}>"Start a trip to ruin this."</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} style={{ background: "#0F0F0F", border: "2px solid #1A1A1A", borderRadius: 20, padding: 28, flex: 1 }}>
              <MapPin size={28} color="#F5FF50" weight="bold" />
              <p style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 42, color: "white", margin: "12px 0 4px", lineHeight: 1 }}>0</p>
              <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#444444", textTransform: "uppercase", margin: "0 0 8px" }}>ACTIVE TRIPS</p>
              <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 16, color: "#444444", margin: 0 }}>"The suitcase is ready."</p>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ gridColumn: "span 4", background: "#0F0F0F", border: "2px solid #1A1A1A", borderRadius: 20, padding: 32 }}>
            <MapPin size={32} color="#FF4D00" weight="bold" />
            <h3 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 30, color: "white", margin: "16px 0 8px" }}>EXPLORE SPOTS</h3>
            <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 18, color: "#555555", margin: "0 0 24px" }}>"125 destinations. Pick one."</p>
            <Link to="/explore"><button className="btn-ghost" style={{ fontSize: 13, padding: "12px 24px" }}>BROWSE DESTINATIONS</button></Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ gridColumn: "span 4", background: "#0F0F0F", border: "2px solid #1A1A1A", borderRadius: 20, padding: 32 }}>
            <Lightning size={32} color="#F5FF50" weight="fill" />
            <h3 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 30, color: "white", margin: "16px 0 8px" }}>BOOK FAST</h3>
            <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 18, color: "#555555", margin: "0 0 24px" }}>"Middle seat awaits the slow."</p>
            <Link to="/bookings"><button className="btn-ghost" style={{ fontSize: 13, padding: "12px 24px" }}>BOOK FLIGHTS & STAYS</button></Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ gridColumn: "span 4", background: "rgba(255,45,107,0.04)", border: "2px solid rgba(255,45,107,0.12)", borderRadius: 20, padding: 32 }}>
            <ChatsCircle size={32} color="#FF2D6B" weight="fill" />
            <h3 style={{ fontFamily: "Anton, Impact, sans-serif", fontSize: 30, color: "white", margin: "16px 0 8px" }}>ASK TARA</h3>
            <p style={{ fontFamily: "Caveat, cursive", fontWeight: 700, fontSize: 18, color: "#FF2D6B", margin: "0 0 24px" }}>"AI concierge, offline-proof."</p>
            <Link to="/trips"><button style={{ background: "transparent", border: "1.5px solid rgba(255,45,107,0.3)", borderRadius: 8, padding: "12px 24px", fontFamily: "Anton, sans-serif", fontSize: 13, color: "#FF2D6B", letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,45,107,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>CHAT NOW</button></Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
