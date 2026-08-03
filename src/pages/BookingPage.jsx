import { useState } from "react";
const STATUS_COLOR = { confirmed: 'text-green-400', pending: 'text-yellow-400', cancelled: 'text-red-400' };
export default function BookingPage() {
  const [bookings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("travelo_bookings_v3") || '[]'); }
    catch { return [{ id: 'b1', type: 'Flight', name: 'DEL - GOA (InDiGo)', date: '2025-08-15', status: 'confirmed', amount: 6500 },{ id: 'b2', type: 'Hotel', name: 'The Leela Goa', date: '2025-08-15', status: 'confirmed', amount: 12000 },{ id: 'b3', type: 'Activity', name: 'Scuba Diving', date: '2025-08-16', status: 'pending', amount: 2500 }]; }
  });
  const total = bookings.reduce((a, b) => a + b.amount, 0);
  return (
    <div className="min-h-screen bg-[#030303] pt-40 pb-20 px-6 md:px-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-[12vw] font-[900] uppercase font-bebas mb-8">LINE ITEMS</h1>
        <div className="silicon-glass mb-10">
          {bookings.map(b => (
            <div key={b.id} className="flex items-center justify-between py-6 border-b border-white/5 last:border-0">
              <div><p className="font-black text-xl uppercase tracking-wider text-white">{b.name}</p><p className="text-white/40 font-bold text-sm uppercase tracking-widest mt-1">{b.type} • {b.date}</p></div>
              <div class="text-right"><p className="font-[900] text-2xl font-bebas text-white">₹{b.amount.toLocaleString()}</p><span className={`font-black text-xs uppercase tracking-widest ${STATUS_COLOR[b.status]}`}>{b.status}</span></div>
            </div>
          ))}
        </div>
        <div className="silicon-glass bg-orange-500/5 border-orange-500/20">
          <p className="text-white/40 font-bold text-xs uppercase tracking-widest">TOTAL COMMITMENT</p>
          <p className="text-[10vw] font-[900] font-bebas text-orange-500 italic leading-none">₹ {total.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
