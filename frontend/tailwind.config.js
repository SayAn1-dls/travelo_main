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
        crazy: ['Permanent Marker', 'cursive'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        sexy: {
          orange: '#FF4D00',
          yellow: '#EAFF00',
          cyan: '#00F0FF',
          pink: '#FF007A',
          black: '#050505',
          dark: '#0A0A0A',
          glass: 'rgba(255, 255, 255, 0.03)',
        }
      },
      boxShadow: {
        'sexy-orange': '0 0 40px rgba(255, 77, 0, 0.25)',
        'sexy-cyan': '0 0 40px rgba(0, 240, 255, 0.25)',
        'sharp': '12px 12px 0px rgba(255, 77, 0, 1)',
        'sharp-cyan': '12px 12px 0px rgba(0, 240, 255, 1)',
      },
      borderRadius: {
        'sexy': '2.5rem',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
