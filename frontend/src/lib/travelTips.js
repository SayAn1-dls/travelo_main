// Travel tips — currently unused, kept for future use
export const TARA_TIPS = [
  { category: 'BOOKING', tip: 'Flights are cheapest 6-8 weeks out.', emoji: '✈️' },
  { category: 'PACKING', tip: 'One carry-on. Always. Checked bags are a trap.', emoji: '🎒' },
  { category: 'MONEY', tip: "Split expenses daily. Memory fades. Resentment doesn't.", emoji: '💸' },
  { category: 'SQUAD', tip: 'Assign a trip lead. Democracy on trips = chaos.', emoji: '👑' },
  { category: 'VIBES', tip: 'The best trip memory is never the planned part.', emoji: '🔥' },
];

export const getRandomTip = () => TARA_TIPS[Math.floor(Math.random() * TARA_TIPS.length)];
