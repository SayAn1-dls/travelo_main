import { AirplaneTilt, Train, Buildings, ArrowSquareOut, Warning } from "@phosphor-icons/react";

const LINKS = [
  {
    type: "FLIGHTS",
    icon: AirplaneTilt,
    colorClass: "text-brutal-orange",
    borderClass: "border-brutal-orange",
    shadowClass: "shadow-brutal",
    quip: '"Because a 3am bus is not the vibe."',
    portals: [
      { name: "IndiGo", url: "https://www.goindigo.in", note: "Budget king. Always." },
      { name: "Air India", url: "https://www.airindia.in", note: "When budget nahi banta" },
      { name: "MakeMyTrip", url: "https://www.makemytrip.com/flights", note: "Comparison God" },
      { name: "Skyscanner", url: "https://www.skyscanner.co.in", note: "Go full flex mode" },
    ],
  },
  {
    type: "HOTELS & STAYS",
    icon: Buildings,
    colorClass: "text-brutal-cyan",
    borderClass: "border-brutal-cyan",
    shadowClass: "shadow-brutal-cyan",
    quip: '"Hostel bunk or penthouse \u2014 your call."',
    portals: [
      { name: "Booking.com", url: "https://www.booking.com", note: "Widest inventory" },
      { name: "Airbnb", url: "https://www.airbnb.co.in", note: "Local experience vibes" },
      { name: "OYO Rooms", url: "https://www.oyorooms.com", note: "Budget warrior mode" },
      { name: "Goibibo", url: "https://www.goibibo.com/hotels", note: "Desi getaways" },
    ],
  },
  {
    type: "TRAINS",
    icon: Train,
    colorClass: "text-brutal-acid",
    borderClass: "border-brutal-acid",
    shadowClass: "shadow-brutal-acid",
    quip: '"Sir, ticket confirm hai? Sir??"',
    portals: [
      { name: "IRCTC", url: "https://www.irctc.co.in", note: "The government's drama" },
      { name: "RailYatri", url: "https://www.railyatri.in", note: "PNR status anxiety" },
      { name: "Confirmtkt", url: "https://www.confirmtkt.com", note: "Waitlist survival guide" },
    ],
  },
];

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-black pt-40 pb-20 px-10 selection:bg-brutal-acid selection:text-black">
      <div className="max-w-5xl mx-auto">

        {/* PAGE HEADER */}
        <header className="mb-12">
          <div className="inline-block bg-white text-black px-6 py-2 border-4 border-brutal-orange mb-10 rotate-[1deg]">
            <span className="font-bebas text-2xl tracking-widest">MISSION LOGISTICS &#x2014; BOOK NOW OR CRY LATER</span>
          </div>
          <h1 className="header-massive text-[10vw] leading-none mb-4">
            SECURE<br /><span className="text-brutal-orange">THE SEAT.</span>
          </h1>
          <p className="font-marker text-4xl text-brutal-acid rotate-[-1deg]">
            "Secure the seat, secure the vibe."
          </p>
          <p className="font-marker text-2xl text-white/40 mt-4">
            "You said you'll book tomorrow. It's been 3 weeks, Sayan."
          </p>
        </header>

        {/* DISCLAIMER BANNER */}
        <div className="border-4 border-brutal-acid bg-brutal-acid/5 p-6 flex items-center gap-6 mb-16 shadow-brutal-acid">
          <Warning size={28} weight="bold" className="text-brutal-acid flex-shrink-0" />
          <p className="font-bebas text-xl text-brutal-acid/80 tracking-widest uppercase">
            Direct links only. No middleman. No data selling. Just you, your card, and the airport drop anxiety.
          </p>
        </div>

        {/* BOOKING SECTIONS */}
        <div className="flex flex-col gap-20">
          {LINKS.map((section, si) => (
            <div key={si}>
              {/* Section Header */}
              <div className={`border-4 ${section.borderClass} p-6 mb-8 flex flex-col md:flex-row md:items-center gap-4`}>
                <section.icon size={36} weight="bold" className={section.colorClass} />
                <h2 className={`header-massive text-6xl ${section.colorClass}`}>{section.type}</h2>
                <p className="font-marker text-2xl text-white/60 md:ml-auto">{section.quip}</p>
              </div>

              {/* Portal Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {section.portals.map((p, pi) => (
                  <a
                    key={pi}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="no-underline group"
                  >
                    <div className={`brutal-card h-full flex flex-col justify-between ${section.borderClass} ${section.shadowClass}`}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="header-massive text-3xl text-white">{p.name}</h3>
                        <ArrowSquareOut size={20} weight="bold" className={`${section.colorClass} group-hover:scale-110 transition-transform`} />
                      </div>
                      <p className="font-marker text-lg text-white/50">{p.note}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* PRO TIP */}
        <div className="mt-20 brutal-card border-brutal-orange shadow-brutal">
          <div className="header-massive text-5xl text-brutal-orange mb-6">PRO TIP</div>
          <p className="font-bebas text-2xl text-white/70 tracking-widest leading-relaxed mb-6">
            BOOK FLIGHTS TUESDAY/WEDNESDAY AT MIDNIGHT FOR BEST PRICES. HOTELS &#x2014; 2 WEEKS OUT FOR MOUNTAINS, 3 DAYS BEFORE FOR CITIES.
          </p>
          <p className="font-marker text-2xl text-white/40 rotate-[-1deg]">
            "This advice is free. The regret from ignoring it isn't."
          </p>
        </div>

      </div>
    </div>
  );
}
