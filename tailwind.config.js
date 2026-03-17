/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#c8ee44',
          dark: '#a3c428',
          muted: 'rgba(200,238,68,0.15)',
        },
        income: '#34d399',
        expense: '#f87171',
        surface: {
          light: '#f5f5f7',
          dark: '#050505',
          'dark-elevated': '#0a0a0a',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'glass': '0 0 0 1px rgba(255,255,255,0.08)',
        'glow-blue': '0 0 30px rgba(59,130,246,0.25)',
        'glow-green': '0 0 30px rgba(200,238,68,0.2)',
        'glow-mic': '0 4px 30px rgba(200,238,68,0.4), 0 0 60px rgba(200,238,68,0.15)',
        'card-light': '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
      },
      animation: {
        'mic-pulse': 'micPulse 4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        micPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.06)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
