/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          dark: '#0f0f19',
          card: 'rgba(15, 15, 25, 0.85)',
        },
        accent: {
          primary: '#667eea',
          secondary: '#764ba2',
          highlight: '#ffd93d',
        },
        text: {
          primary: '#e0e6ff',
          secondary: '#b8c5ff',
          muted: 'rgba(255, 255, 255, 0.4)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'gradient-shift': 'gradientShift 15s ease infinite',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        }
      }
    },
  },
  plugins: [],
}