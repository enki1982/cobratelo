/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          black: '#111110',
          cream: '#F7F3EC',
          green: '#1A7A4A',
          'green-light': '#E8F5EE',
          'green-bright': '#22C55E',
          orange: '#E8540A',
          'orange-light': '#FEF0E8',
        }
      }
    },
  },
  plugins: [],
}
