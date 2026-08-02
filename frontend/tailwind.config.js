/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        bebas: ['Bebas Neue', 'cursive'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        orange: { 500: '#FF4D00' },
        cyan: { 500: '#00F0FF' },
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
