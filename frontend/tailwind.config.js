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
        bebas: ['Bebas Neue', 'Impact', 'Arial Narrow', 'sans-serif'],
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
      },
      fontSize: {
        '10xl': ['10rem', { lineHeight: '0.9' }],
        '11xl': ['12rem', { lineHeight: '0.85' }],
        '12xl': ['14rem', { lineHeight: '0.8' }],
      },
      borderRadius: {
        lg: '1.5rem',
        md: '1rem',
        sm: '0.75rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        flame: { DEFAULT: '#FF4500', light: '#FF6B35', dark: '#CC3700', 50: '#FFF1EC' },
        neon: { yellow: '#FFE600', cyan: '#00F5D4', green: '#39FF14' },
        space: { DEFAULT: '#0A0A0A', card: '#141414', border: '#2A2A2A', muted: '#888888' },
      },
      backgroundImage: {
        'flame-gradient': 'linear-gradient(135deg, #FF4500 0%, #FF8C00 50%, #FFE600 100%)',
        'ocean-gradient': 'linear-gradient(135deg, #0A0A0A 0%, #1a1a2e 50%, #16213e 100%)',
        'card-gradient': 'linear-gradient(135deg, #141414 0%, #1e1e1e 100%)',
        'hero-overlay': 'linear-gradient(180deg, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.3) 50%, rgba(10,10,10,0.9) 100%)',
      },
      boxShadow: {
        'flame': '0 0 30px rgba(255,69,0,0.4), 0 8px 32px rgba(255,69,0,0.2)',
        'flame-sm': '0 0 15px rgba(255,69,0,0.3)',
        'neon': '0 0 30px rgba(0,245,212,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,69,0,0.3)',
        'lift': '0 20px 60px rgba(0,0,0,0.5)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-18px) rotate(5deg)' },
          '66%': { transform: 'translateY(-8px) rotate(-3deg)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg) scale(1)' },
          '50%': { transform: 'translateY(-25px) rotate(8deg) scale(1.05)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255,69,0,0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(255,69,0,0.8), 0 0 80px rgba(255,69,0,0.3)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        slideUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'float-delay': 'float 5s ease-in-out 1s infinite',
        'float-delay2': 'floatSlow 7s ease-in-out 2s infinite',
        'float-delay3': 'float 4.5s ease-in-out 0.5s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'slide-up': 'slideUp 0.6s ease-out',
        'marquee': 'marquee 20s linear infinite',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
