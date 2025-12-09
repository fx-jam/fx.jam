/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class', // Activer le mode sombre avec la classe 'dark'
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // Indigo principal
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#1e1b4b', // Plus sombre pour le fond
        },
        accent: {
          400: '#a78bfa',
          500: '#8b5cf6', // Violet
          600: '#7c3aed',
        },
        gray: {
          800: '#1f2937',
          850: '#1a2232',
          900: '#111827',
          950: '#0a0f1a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 15px rgba(99, 102, 241, 0.3)',
        'glow-accent': '0 0 15px rgba(139, 92, 246, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'gradient': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addUtilities }) {
      const newUtilities = {
        '.text-gradient': {
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          'color': 'transparent',
          'background-image': 'linear-gradient(90deg, #6366f1, #8b5cf6)',
        },
        '.bg-glass': {
          'background': 'rgba(17, 24, 39, 0.6)',
          'backdrop-filter': 'blur(8px)',
          '-webkit-backdrop-filter': 'blur(8px)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
}
