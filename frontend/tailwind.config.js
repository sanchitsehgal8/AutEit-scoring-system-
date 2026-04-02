/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Custom palette tuned to the provided reference color.
        slate: {
          50: '#edf7fb',
          100: '#d9edf6',
          200: '#badbeb',
          300: '#8ebfd3',
          400: '#6ea2ba',
          500: '#4e869f',
          600: '#386c83',
          700: '#265467',
          800: '#163b4b',
          900: '#0d2a39',
          950: '#061821',
        },
        cyan: {
          100: '#dbf0fb',
          200: '#bae2f7',
          300: '#8dcee9',
          400: '#66b8dc',
          500: '#3f9fca',
          600: '#2f83a8',
          700: '#246886',
          800: '#194d64',
          900: '#123847',
          950: '#0a2330',
        },
        surface: '#0d2a39',
        accent: '#66b8dc',
      },
      boxShadow: {
        card: '0 10px 28px rgba(6, 24, 33, 0.45)',
      },
    },
  },
  plugins: [],
};
