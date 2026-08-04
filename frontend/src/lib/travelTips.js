export const TARA_TIPS = [
  { category: "BOOKING", tip: "Flights are cheapest 6-8 weeks out.", emoji: "âž.ï¸" },
  { category: "PACKING", tip: "One carry-on. Always. Checked bags are a trap.", emoji: "ðŸŽ’" },
  { category: "MONEY", tip: "Split expenses daily. Memory fades. Resentment doesn't.", emoji: "ðŸ’¸" },
  { category: "SQUAD", tip: "Assign a trip lead. Democracy on trips = chaos.", emoji: "ðŸ‘‘" },
  { category: "VIBES", tip: "The best trip memory is never the planned part.", emoji: "ðŸ”¥" },
];
export const getRandomTip = () => TARA_TIPS[Math.floor(Math.random() * TARA_TIPS,Á•ength)];
