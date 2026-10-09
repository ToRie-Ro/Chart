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
        bluewave: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
          // Brand colors
          navy: '#090e17',
          'navy-light': '#0f172a',
          'navy-card': '#111c30',
          'navy-hover': '#16233d',
          electric: '#2563eb',
          'electric-bright': '#3b82f6',
          cyan: '#06b6d4',
          'cyan-bright': '#22d3ee',
          bubble: '#182438',
          'bubble-sent': '#2563eb',
        },
        chart: {
          navy: '#090e17',
          'navy-light': '#0f172a',
          'navy-card': '#111c30',
          'navy-hover': '#16233d',
          electric: '#2563eb',
          'electric-bright': '#3b82f6',
          cyan: '#06b6d4',
          'cyan-bright': '#22d3ee',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(37, 99, 235, 0.4)',
        'glow-cyan': '0 0 20px -5px rgba(6, 182, 212, 0.4)',
      },
    },
  },
  plugins: [],
}
