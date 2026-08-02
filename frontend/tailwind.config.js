/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        bebas: ['"Bebas Neue"', "sans-serif"],
        jakarta: ['"Plus Jakarta Sans"', "sans-serif"],
      },
      backdropBlur: {
        "4xl": "80px",
        "5xl": "120px",
      },
      boxShadow: {
        silicon: "0 40px 120px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)",
        "orange-glow": "0 0 60px rgba(249,115,22,0.35)",
        "cyan-glow": "0 0 60px rgba(6,182,212,0.25)",
      },
    },
  },
  plugins: [],
};
