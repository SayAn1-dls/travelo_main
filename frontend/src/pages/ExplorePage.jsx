import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/lib/api";

export default function ExplorePage() {
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    api.get("/destinations").then((r) => setDestinations(r.data)).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
      <p className="uppercase tracking-[0.25em] text-xs font-semibold text-[#E25822] mb-2">Destination hubs</p>
      <h1 className="font-display text-4xl sm:text-5xl font-bold">Explore & get around</h1>
      <p className="text-muted-foreground mt-3 max-w-xl">Every destination hub shows the local buses, cab apps, scooter rentals and car hires — so you land knowing exactly how to move.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {destinations.map((d, i) => (
          <motion.div key={d.slug} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link to={`/destinations/${d.slug}`} data-testid={`explore-destination-${d.slug}`} className="group block relative rounded-2xl overflow-hidden h-80">
              <img src={d.image} alt={d.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute bottom-0 p-6 text-white w-full">
                <p className="text-xs uppercase tracking-widest text-white/70">{d.country} · Best: {d.best_time}</p>
                <h3 className="font-display text-3xl font-bold mt-1">{d.name}</h3>
                <p className="text-sm text-white/85">{d.tagline}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
