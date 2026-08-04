/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        bebas: ['Bebas Neue', 'cursive'],
        marker: ['Permanent Marker', 'cursive'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        orange: { 500: '#FF4D00', 400: '#FF6A00', 600: '#D44000' },
        cyan: { 500: '#00F0FF' },
      },
      backdropBlur: {
        '60': '60px',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};