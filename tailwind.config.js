/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#04070D',
          900: '#080C14',
          850: '#0D131F',
          800: '#131C2D',
          700: '#1E2B42',
          600: '#2A3B59',
        },
        gold: {
          50: '#FFFDF5',
          100: '#FEF7D6',
          200: '#FDEB9E',
          300: '#FBDA5E',
          400: '#F8C327',
          500: '#EAB308',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          accent: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.25)',
        },
        emerald: {
          accent: '#10B981',
          glow: 'rgba(16, 185, 129, 0.25)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'gold-sm': '0 0 15px rgba(245, 158, 11, 0.15)',
        'gold-md': '0 0 30px rgba(245, 158, 11, 0.25)',
        'gold-lg': '0 0 50px rgba(245, 158, 11, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-delayed': 'floatDelayed 7s ease-in-out 2s infinite',
        'float-reverse': 'floatReverse 7.5s ease-in-out infinite',
        'spin-very-slow': 'spin 60s linear infinite',
        'spin-reverse-slow': 'spinReverse 45s linear infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'ticker': 'ticker 35s linear infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'radar': 'radar 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        floatDelayed: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translateY(-6px)' },
          '50%': { transform: 'translateY(10px)' },
        },
        spinReverse: {
          'from': { transform: 'rotate(360deg)' },
          'to': { transform: 'rotate(0deg)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
