/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        bebas: ['Bebas Neue', 'cursive'],
        marker: ['Permanent Marker', 'cursive'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brutal: {
          orange: '#FF4D00',
          acid: '#EAFF00',
          cyan: '#00F0FF',
          pink: '#FF007A',
          black: '#000000',
          grey: '#111111',
        }
      },
      boxShadow: {
        'brutal': '8px 8px 0px #FF4D00',
        'brutal-acid': '8px 8px 0px #EAFF00',
        'brutal-cyan': '8px 8px 0px #00F0FF',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
