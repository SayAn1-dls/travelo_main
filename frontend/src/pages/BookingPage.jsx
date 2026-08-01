import { AirplaneTilt, Train, Buildings, Lightning, ArrowSquareOut } from "@phosphor-icons/react";

export default function BookingPage() {
  return (
    <div className="min-h-screen pt-40 px-10 pb-20 bg-sexy-black">
      <div className="max-w-7xl mx-auto">

        <header className="mb-20">
          <p className="font-black text-[10px] tracking-[0.4em] uppercase text-sexy-orange/60 mb-6">BOOKING COMMAND</p>
          <h1 className="goated-heading text-[9vw] leading-none mb-6">
            MISSION <span className="text-gradient-sexy">LOGISTICS</span>
          </h1>
          <p className="crazy-text text-3xl">
            "Secure the seat before your squad does. You know how they are."
          </p>
        </header>

        {/* BOOKING TYPE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
          {[
            {
              id: 'flights',
              label: 'FLIGHTS',
              sub: 'Book before the price jumps',
              icon: AirplaneTilt,
              color: 'text-sexy-orange',
              borderHover: 'hover:border-sexy-orange',
              quip: '"Window seat or are you even trying?"',
              url: 'https://www.makemytrip.com/flights/',
            },
            {
              id: 'hotels',
              label: 'STAYS',
              sub: 'Sleep well. Or don\'t. No judgement.',
              icon: Buildings,
              color: 'text-sexy-cyan',
              borderHover: 'hover:border-sexy-cyan',
              quip: '"A good bed makes the trip. A bad one makes the story."',
              url: 'https://www.booking.com',
            },
            {
              id: 'trains',
              label: 'RAILS',
              sub: 'The OG Indian adventure',
              icon: Train,
              color: 'text-sexy-yellow',
              borderHover: 'hover:border-sexy-yellow',
              quip: '"Pantry car walo ka chai + your dreams = priceless."',
              url: 'https://www.irctc.co.in',
            },
          ].map((item) => (
            <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="no-underline">
              <div className={`sexy-card ${item.borderHover} flex flex-col items-center py-16 gap-6 cursor-pointer`}>
                <item.icon size={72} className={`${item.color}`} weight="duotone" />
                <h3 className={`goated-heading text-6xl tracking-widest ${item.color}`}>{item.label}</h3>
                <p className="font-semibold text-white/50 text-sm uppercase tracking-widest text-center">{item.sub}</p>
                <p className="crazy-text text-base text-center opacity-70 px-4">{item.quip}</p>
              </div>
            </a>
          ))}
        </div>

        {/* PARTNER REDIRECT */}
        <div className="sexy-card relative overflow-hidden border-white/10">
          <div className="absolute top-8 right-8">
            <Lightning weight="fill" className="text-sexy-yellow" size={36} />
          </div>
          <p className="font-black text-[10px] tracking-[0.4em] uppercase text-sexy-yellow/60 mb-4">FAST LANE</p>
          <h2 className="goated-heading text-5xl mb-6">DIRECT OPERATOR ACCESS</h2>
          <p className="crystal-clear text-lg max-w-2xl mb-10">
            No middle-man markup. No fake urgency timers. Just a clean link to the source — because your budget deserves better than a booking fee.
          </p>
          <div className="flex flex-wrap gap-6">
            <a href="https://www.goindigo.in" target="_blank" rel="noopener noreferrer">
              <button className="px-10 py-5 rounded-full border-2 border-white/20 font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-3">
                INDIGO PORTAL <ArrowSquareOut size={20} />
              </button>
            </a>
            <a href="https://www.airasia.com" target="_blank" rel="noopener noreferrer">
              <button className="px-10 py-5 rounded-full border-2 border-white/20 font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-3">
                AIRASIA <ArrowSquareOut size={20} />
              </button>
            </a>
            <a href="https://www.airbnb.co.in" target="_blank" rel="noopener noreferrer">
              <button className="px-10 py-5 rounded-full border-2 border-sexy-orange/40 font-black uppercase tracking-widest hover:bg-sexy-orange hover:border-sexy-orange hover:text-white transition-all flex items-center gap-3">
                AIRBNB STAYS <ArrowSquareOut size={20} />
              </button>
            </a>
          </div>
        </div>

        {/* FOOTER LINE */}
        <div className="mt-20 text-center">
          <p className="crazy-text text-2xl italic opacity-60">"You're not lost. You're on an unplanned adventure. There's a difference."</p>
        </div>

      </div>
    </div>
  );
}
