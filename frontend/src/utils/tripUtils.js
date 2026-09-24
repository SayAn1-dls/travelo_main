/**
 * tripUtils.js — Travelo Trip Utility Functions
 * Shared helpers for trip scoring, duration formatting,
 * budget estimation, and itinerary validation.
 */

// ── Duration formatting ─────────────────────────────────────────────────────

/**
 * Format a duration in minutes to a human-readable string.
 * @param {number} minutes
 * @returns {string} e.g. "2h 30m", "45m", "1h"
 */
export function formatDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes < 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Calculate the number of nights between two ISO date strings.
 * @param {string} checkIn  ISO date string
 * @param {string} checkOut ISO date string
 * @returns {number}
 */
export function countNights(checkIn, checkOut) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = new Date(checkOut) - new Date(checkIn);
  return Math.max(0, Math.round(diff / msPerDay));
}

// ── Budget helpers ───────────────────────────────────────────────────────────

/**
 * Estimate a per-day budget range for a destination tier.
 * @param {"budget"|"mid"|"luxury"} tier
 * @param {string} currency  ISO 4217 code (default "INR")
 * @returns {{ min: number, max: number, label: string }}
 */
export function estimateDailyBudget(tier, currency = "INR") {
  const ranges = {
    INR: { budget: [800, 2000], mid: [2000, 6000], luxury: [6000, 20000] },
    USD: { budget: [20, 60],    mid: [60, 180],    luxury: [180, 600]   },
    EUR: { budget: [18, 55],    mid: [55, 160],    luxury: [160, 550]   },
  };
  const cur = ranges[currency] ?? ranges.INR;
  const [min, max] = cur[tier] ?? cur.mid;
  return { min, max, label: `${currency} ${min.toLocaleString()}–${max.toLocaleString()}/day` };
}

/**
 * Sum total trip budget from an array of expense objects.
 * @param {Array<{ amount: number, category: string }>} expenses
 * @returns {{ total: number, byCategory: Object }}
 */
export function summariseExpenses(expenses = []) {
  const byCategory = {};
  let total = 0;
  for (const { amount = 0, category = "misc" } of expenses) {
    byCategory[category] = (byCategory[category] ?? 0) + amount;
    total += amount;
  }
  return { total, byCategory };
}

// ── Trip scoring ────────────────────────────────────────────────────────────

/**
 * Score a trip itinerary completeness (0–100).
 * Rewards having destinations, activities, accommodation, and dates set.
 * @param {Object} trip
 * @returns {{ score: number, missing: string[] }}
 */
export function scoreTripCompleteness(trip = {}) {
  const checks = [
    { key: "destination",   label: "Destination",   weight: 30 },
    { key: "startDate",     label: "Start date",    weight: 15 },
    { key: "endDate",       label: "End date",      weight: 15 },
    { key: "accommodation", label: "Accommodation", weight: 20 },
    { key: "activities",    label: "Activities",    weight: 20 },
  ];

  let score = 0;
  const missing = [];

  for (const { key, label, weight } of checks) {
    const val = trip[key];
    const hasValue = Array.isArray(val) ? val.length > 0 : Boolean(val);
    if (hasValue) {
      score += weight;
    } else {
      missing.push(label);
    }
  }

  return { score, missing };
}

// ── Itinerary validation ────────────────────────────────────────────────────

/**
 * Validate that trip dates are logically consistent.
 * @param {string} startDate ISO date
 * @param {string} endDate   ISO date
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateTripDates(startDate, endDate) {
  if (!startDate || !endDate) return { valid: false, error: "Both start and end dates are required." };
  const start = new Date(startDate);
  const end   = new Date(endDate);
  const now   = new Date();
  now.setHours(0, 0, 0, 0);
  if (isNaN(start) || isNaN(end)) return { valid: false, error: "Invalid date format." };
  if (start < now)  return { valid: false, error: "Start date cannot be in the past." };
  if (end <= start) return { valid: false, error: "End date must be after start date." };
  if (countNights(startDate, endDate) > 365) return { valid: false, error: "Trip duration cannot exceed 365 nights." };
  return { valid: true, error: null };
}

// ── Destination matching ────────────────────────────────────────────────────

/**
 * Rank destinations by vibe match score against user preferences.
 * @param {string[]} userVibes      e.g. ["adventure", "nature"]
 * @param {Array<{ name: string, vibes: string[] }>} destinations
 * @returns {Array<{ name: string, matchScore: number }>} sorted descending
 */
export function rankByVibeMatch(userVibes = [], destinations = []) {
  return destinations
    .map((dest) => {
      const matches = dest.vibes.filter((v) => userVibes.includes(v)).length;
      const matchScore = dest.vibes.length > 0
        ? Math.round((matches / dest.vibes.length) * 100)
        : 0;
      return { name: dest.name, matchScore };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
