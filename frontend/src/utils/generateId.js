// Zero-collision mission ID generator — Travelo Intelligence Engine
export const generateMissionId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRV-${timestamp}-${random}`;
};

export const generateBoardingCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

export const generateSquadCode = (prefix = 'SQD') => {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${num}`;
};

export const isValidMissionId = (id) =>
  /^TRV-[A-Z0-9]+-[A-Z0-9]{6}$/.test(id);
