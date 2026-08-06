// Brand voice token quotes — currently unused, kept for future use
export const QUOTES = [
  'BAGS BY THE DOOR. BRAIN SET TO VIBE.',
  'THE ITINERARY IS A SUGGESTION. GO ROGUE.',
  'SLEEP IS OPTIONAL. MEMORIES ARE NOT.',
  'YOUR PASSPORT IS BORED. FIX THAT.',
  'THE BEST TRIPS HAVE ZERO PLAN AND INFINITE VIBE.',
  'EVERY TRIP IS A CHAPTER. WRITE A BANGER.',
  'BOOK IT. YOUR FUTURE SELF IS ALREADY PACKING.',
];

export const getRandomQuote = () => QUOTES[Math.floor(Math.random() * QUOTES.length)];
