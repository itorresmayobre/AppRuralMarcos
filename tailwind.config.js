/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rural: {
          50: '#f4f7f4',
          100: '#e3ebe4',
          500: '#2e5a36',
          600: '#234629',
          700: '#19331d',
          800: '#102213',
        },
        gold: {
          500: '#d4af37',
          600: '#b89628',
        }
      }
    },
  },
  plugins: [],
}
