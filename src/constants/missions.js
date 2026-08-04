// Travelo Mission Constants — v4.0.2 FINAL
export const APP_VERSION = '4.0.2';
export const APP_CODENAME = 'SILICON SIEGE';
export const BUILD_DATE = '2026-08-04';
export const REPO = 'SayAn1-dls/travelo_main';

export const MISSION_STATUS = {
  PLANNING:  'PLANNING',
  ACTIVE:    'ACTIVE',
  COMPLETED: 'COMPLETED',
  ABORTED:   'ABORTED',
};

export const TRIP_CATEGORIES = [
  'ADVENTURE', 'LEISURE', 'BUSINESS',
  'FAMILY', 'SOLO', 'SQUAD', 'HONEYMOON',
];

export const DESTINATIONS_TIER_1 = [
  { name: 'BALI',        country: 'INDONESIA', code: 'DPS', emoji: '🌴' },
  { name: 'TOKYO',       country: 'JAPAN',     code: 'HND', emoji: '🗼' },
  { name: 'PARIS',       country: 'FRANCE',    code: 'CDG', emoji: '🗽' },
  { name: 'NEW YORK',    country: 'USA',        code: 'JFK', emoji: '🗽' },
  { name: 'DUBAI',       country: 'UAE',        code: 'DXB', emoji: '🏙️' },
  { name: 'SINGAPORE',   country: 'SINGAPORE',  code: 'SIN', emoji: '🦁' },
  { name: 'LONDON',      country: 'UK',         code: 'LHR', emoji: '🎡' },
  { name: 'MALDIVES',    country: 'MALDIVES',   code: 'MLE', emoji: '🐠' },
  { name: 'SANTORINI',   country: 'GREECE',     code: 'JTR', emoji: '🏛️' },
  { name: 'GOA',         country: 'INDIA',      code: 'GOI', emoji: '🏖️' },
];

export const DEEP_GREEN_SURGE = {
  date: BUILD_DATE,
  commits: 25,
  status: 'COMPLETE',
  message: 'Graph is deep green. Sayan wins.',
};
