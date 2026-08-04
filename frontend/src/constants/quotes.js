// Elite travel quote corpus — Travelo Command Intelligence
export const TRAVEL_QUOTES = [
  "The world is a book, and those who do not travel read only one page.",
  "Not all those who wander are lost.",
  "Travel is the only thing you buy that makes you richer.",
  "Jobs fill your pocket. Adventures fill your soul.",
  "Life is short and the world is wide. The sooner you start exploring it, the better.",
  "To travel is to live.",
  "Once a year, go somewhere you have never been before.",
  "Adventure is worthwhile in itself.",
  "The journey not the arrival matters.",
  "A ship in harbor is safe — but that is not what ships are for.",
  "We travel not to escape life, but for life not to escape us.",
  "Wherever you go, go with all your heart.",
  "Travel makes one modest. You see what a tiny place you occupy in the world.",
  "The gladdest moment in human life is a departure into unknown lands.",
  "Collect moments, not things.",
];

export const getRandomQuote = () =>
  TRAVEL_QUOTES[Math.floor(Math.random() * TRAVEL_QUOTES.length)];
