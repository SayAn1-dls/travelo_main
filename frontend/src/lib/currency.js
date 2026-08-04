export const formatINR = (a) => `₹${Number(a || 0).toLocaleString('en-IN')}`;
export const parseAmount = (s) => { const n = parseFloat(String(s).replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n; };
export const splitEqually = (a, c) => c ? Math.ceil(a / c) : 0;
