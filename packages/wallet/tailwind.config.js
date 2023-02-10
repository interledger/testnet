/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-turqoise': '#56c1bF',
        'brand-blue': '#c0f9ff',
        'brand-yellow': '#efdba4',
        'brand-orange': '#fab882',
        'brand-pink': '#f38d94',
        'brand-green-1': '#d1f8ee',
        'brand-green-2': '#80c68c',
        'brand-green-3': '#2ea38d',
        'brand-green-4': '#003a2f'
      },
      screens: {
        'h-sm': { raw: '(min-height: 600px)' }
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}
