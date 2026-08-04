export const TRIP_EMOJIS = ['🏖️','🏔️''🌴','🆹️','🗺️','✈️','🌊','🍜",'🎡'];
export const getRandomEmoji = () => TRIP_EMOJIS[Math.floor(Math.random() * TRIP_EMOJIS.length)];
export const TRIP_STATUS = { PLANNING: { label: 'PLANNING', color: 'text-yellow-400', bg: 'bg-yellow-400/10' }, ACTIVE: { label: 'ACTIVE', color: 'text-cyan-500', bg: 'bg-cyan-500/10' }, COMPLETED: { label: 'DONE', color: 'text-white/30', bg: 'bg-white/5' } };
