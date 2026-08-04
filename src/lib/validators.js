// Travelo Mission-Grade Input Validators

export const validators = {
  required: (v) => (v && String(v).trim().length > 0) || 'This field is required.',

  email: (v) => {
    if (!v) return 'Email is required.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Invalid email address.';
  },

  password: (v) => {
    if (!v || v.length < 6) return 'Password must be at least 6 characters.';
    return true;
  },

  minLength: (min) => (v) =>
    (v && v.length >= min) || `Must be at least ${min} characters.`,

  maxLength: (max) => (v) =>
    (!v || v.length <= max) || `Cannot exceed ${max} characters.`,

  date: (v) => {
    if (!v) return 'Date is required.';
    return !isNaN(new Date(v).getTime()) || 'Invalid date format.';
  },

  futureDate: (v) => {
    if (!v) return 'Date is required.';
    return new Date(v) > new Date() || 'Date must be in the future.';
  },

  url: (v) => {
    if (!v) return true;
    try { new URL(v); return true; }
    catch { return 'Invalid URL.'; }
  },
};

export const validate = (value, rules = []) => {
  for (const rule of rules) {
    const result = rule(value);
    if (result !== true) return result;
  }
  return null;
};

export default validators;
