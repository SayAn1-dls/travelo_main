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
        anton: ['Anton', 'Impact', 'sans-serif'],
        bebas: ['Bebas Neue', 'Impact', 'sans-serif'],
        han: ['Black Han Sans', 'sans-serif'],
        caveat: ['Caveat', 'cursive'],
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          orange: '#FF4D00',
          yellow: '#F5FF50',
          cyan: '#00E5FF',
          pink: '#FF2D6B',
          black: '#080808',
          card: '#111111',
          border: '#222222',
        }
      },
      boxShadow: {
        'neon-orange': '0 0 0 2px #FF4D00, 0 0 30px rgba(255,77,0,0.4)',
        'neon-cyan': '0 0 0 2px #00E5FF, 0 0 30px rgba(0,229,255,0.4)',
        'hard-orange': '6px 6px 0px #FF4D00',
        'hard-yellow': '6px 6px 0px #F5FF50',
        'hard-cyan': '6px 6px 0px #00E5FF',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      },
      animation: {
        marquee: 'marquee 20s linear infinite',
        wiggle: 'wiggle 2s ease-in-out infinite',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
