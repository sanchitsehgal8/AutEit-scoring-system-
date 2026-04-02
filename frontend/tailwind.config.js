/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f172a',
        accent: '#22d3ee',
      },
      boxShadow: {
        card: '0 8px 30px rgba(15, 23, 42, 0.35)',
      },
    },
  },
  plugins: [],
};
