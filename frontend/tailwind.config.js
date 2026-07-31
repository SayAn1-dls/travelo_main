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
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif']
      },
      borderRadius: {
        lg: '2rem',
        md: '1.5rem',
        sm: '1rem'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#FF5A36',
          foreground: '#FFFFFF'
        },
        navy: {
          DEFAULT: '#0A2540',
          light: '#1B3B5A',
          dark: '#051421'
        },
        coral: {
          DEFAULT: '#FF5A36',
          light: '#FF8A75',
          dark: '#E63E1C'
        }
      },
      boxShadow: {
        '2xl': '0 25px 50px -12px rgba(255, 90, 54, 0.15)',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
