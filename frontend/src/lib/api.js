import axios from "axios";

const api = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  withCredentials: true,
});

export function formatApiError(err) {
  const detail = err?.response?.data?.detail;
  if (detail == null) return err?.message || "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const CURRENCIES = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "AED ",
  SGD: "S$", THB: "฿", IDR: "Rp ", JPY: "¥", AUD: "A$",
};

export const csym = (code) => CURRENCIES[code || "INR"] || `${code} `;

export const money = (n, code = "INR") =>
  `${csym(code)}${Number(n || 0).toLocaleString(code === "INR" || !code ? "en-IN" : "en-US", { maximumFractionDigits: 0 })}`;

export const inr = (n) => money(n, "INR");

export default api;
