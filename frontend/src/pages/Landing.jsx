import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AirplaneTilt, Train, Buildings, UsersThree, ChatCircleDots, MapTrifold, ArrowRight, Receipt } from "@phosphor-icons/react";

const HERO = "https://images.unsplash.com/photo-1494548162494-384bba4ab999?auto=format&fit=crop&w=1800&q=80";

const features = [
  { icon: AirplaneTilt, title: "Flights, trains & hotels", desc: "One search bar for every leg of the journey. Compare, pick, pay — done.", span: "md:col-span-5" },
  { icon: UsersThree, title: "Group trip planner", desc: "Budgets, expense splitting and 'who owes whom' settled automatically — with one-tap UPI pay links.", span: "md:col-span-7" },
  { icon: MapTrifold, title: "Destination hub", desc: "Land anywhere and instantly know the buses, cabs, scooters and rentals around you.", span: "md:col-span-7" },
  { icon: ChatCircleDots, title: "Tara, your AI guide", desc: "A geolocation-aware assistant that knows the hidden spots near you.", span: "md:col-span-5" },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);

  useEffect(() => {
    api.get("/destinations").then((r) => setDestinations(r.data)).catch(() => {});
  }, []);

  const cta = () => navigate(user ? "/dashboard" : "/auth");

  return (
    <div className="bg-[#F9F8F6] min-h-screen">
      <section ref={heroRef} className="relative h-[92vh] min-h-[560px] overflow-hidden">
        <motion.img src={HERO} alt="Travel destination" style={{ y }} className="absolute inset-0 w-full h-[115%] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/30" />
        <header className="absolute top-0 inset-x-0 z-10">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
            <span className="flex items-center gap-2 text-white">
              <AirplaneTilt size={28} weight="duotone" />
              <span className="font-display font-bold text-2xl">Travelo</span>
            </span>
            <Button data-testid="landing-signin-btn" onClick={cta} variant="outline" className="rounded-full bg-white/10 border-white/40 text-white hover:bg-white hover:text-[#1A1A1A] backdrop-blur-md transition-colors">
              {user ? "Dashboard" : "Sign in"}
            </Button>
          </div>
        </header>
        <div className="absolute inset-x-0 bottom-0 z-10 max-w-7xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/80 uppercase tracking-[0.25em] text-xs font-semibold mb-4">
            Plan · Book · Roam · Split
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="font-display text-white text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] max-w-3xl">
            Wander far.<br />
            <span className="italic text-[#FFB49B]">Split fair.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-white/85 text-base md:text-lg max-w-xl mt-5">
            The all-in-one travel ecosystem — book flights, trains and stays, discover how to get around, and settle group expenses without the awkward math.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="flex flex-wrap gap-3 mt-8">
            <Button data-testid="landing-cta-primary" onClick={cta} size="lg" className="rounded-full bg-[#FF5A36] hover:bg-[#E64322] text-white px-8 h-13 text-base">
              Start your journey <ArrowRight size={18} className="ml-2" />
            </Button>
            <Button data-testid="landing-cta-secondary" onClick={() => navigate(user ? "/trips" : "/auth")} size="lg" variant="outline" className="rounded-full bg-white/10 border-white/40 text-white hover:bg-white hover:text-[#1A1A1A] backdrop-blur-md px-8 h-13 text-base transition-colors">
              Plan a group trip
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <p className="uppercase tracking-[0.25em] text-xs font-semibold text-[#FF5A36] mb-3">Everything in one place</p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold max-w-lg">Built by people who never unpack.</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-12">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`${f.span} bg-white border border-[#E5E4E0] rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-[box-shadow,transform] duration-300`}
            >
              <f.icon size={36} weight="duotone" className="text-[#FF5A36]" />
              <h3 className="font-display text-xl font-bold mt-4">{f.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-8 pb-20 sm:pb-28">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="uppercase tracking-[0.25em] text-xs font-semibold text-[#FF5A36] mb-3">Destination hubs</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Where to next?</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.slice(0, 6).map((d, i) => (
            <motion.div key={d.slug} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <Link to={user ? `/destinations/${d.slug}` : "/auth"} data-testid={`landing-destination-${d.slug}`} className="group block relative rounded-2xl overflow-hidden h-72">
                <img src={d.image} alt={d.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 p-6 text-white">
                  <p className="text-xs uppercase tracking-widest text-white/70">{d.country}</p>
                  <h3 className="font-display text-2xl font-bold">{d.name}</h3>
                  <p className="text-sm text-white/80">{d.tagline}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative bg-[#0A2540] text-white overflow-hidden grain">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 sm:py-28 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <p className="uppercase tracking-[0.25em] text-xs font-semibold text-[#FFB49B] mb-3">The group trip, solved</p>
            <h2 className="font-display text-3xl sm:text-5xl font-bold leading-tight">"Ravi owes you ₹1,200" — handled.</h2>
            <p className="text-white/80 mt-5 leading-relaxed max-w-md">
              Set a trip budget, log expenses as you go, split them equally or your way. Travelo does the settlement math and nudges friends with a UPI deep link that opens their payment app.
            </p>
            <Button data-testid="landing-group-cta" onClick={() => navigate(user ? "/trips" : "/auth")} size="lg" className="rounded-full bg-[#FF5A36] hover:bg-[#E64322] mt-8 px-8">
              Create a travel plan
            </Button>
          </div>
          <div className="space-y-3">
            {[
              { icon: Receipt, t: "Beach shack dinner — ₹2,400", s: "Paid by Meera · split 4 ways" },
              { icon: UsersThree, t: "Ravi owes Meera ₹1,200", s: "Reminder sent · Pay via GPay / PhonePe / Paytm" },
              { icon: Train, t: "Scooter rentals — ₹1,600", s: "Paid by you · custom split" },
            ].map((r) => (
              <div key={r.t} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 flex items-start gap-4">
                <r.icon size={26} weight="duotone" className="text-[#FFB49B] mt-0.5" />
                <div>
                  <p className="font-semibold">{r.t}</p>
                  <p className="text-sm text-white/70">{r.s}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-5 sm:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="flex items-center gap-2">
          <AirplaneTilt size={22} weight="duotone" className="text-[#FF5A36]" />
          <span className="font-display font-bold text-xl">Travelo</span>
        </span>
        <p className="text-sm text-muted-foreground">Plan, book, navigate & split — together.</p>
        <div className="flex gap-2 text-muted-foreground">
          <Buildings size={20} /> <Train size={20} /> <AirplaneTilt size={20} />
        </div>
      </footer>
    </div>
  );
}
