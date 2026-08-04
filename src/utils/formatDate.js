// Mission-grade date formatting — Travelo Command
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

export const formatMissionDate = (date) => {
  const d = new Date(date);
  return `${DAYS[d.getDay()]} ${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatBoardingTime = (date) => {
  const d = new Date(date);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m} HRS`;
};

export const formatRelative = (date) => {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'JUST NOW';
  if (minutes < 60) return `${minutes}M AGO`;
  if (hours < 24) return `${hours}H AGO`;
  return `${days}D AGO`;
};

export const getMissionDuration = (start, end) => {
  const diff = new Date(end) - new Date(start);
  const days = Math.ceil(diff / 86400000);
  return `${days} DAY${days !== 1 ? 'S' : ''}`;
};
