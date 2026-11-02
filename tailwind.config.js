/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        kanit: ['Kanit', 'sans-serif'],
        albert: ['"Albert Sans"', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
      },
      colors: {
        app: { bg: '#0a0e1c', gold: '#EDB40B', red: '#E10600' },
      },
    },
  },
  plugins: [],
}
