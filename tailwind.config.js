module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html', './App.js'],
  darkMode: false,
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      borderColor: ['focus'],
      ringWidth: ['focus'],
      ringColor: ['focus'],
    },
  },
  plugins: [],
}
