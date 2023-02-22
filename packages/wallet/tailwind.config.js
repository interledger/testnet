const twColors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: twColors.transparent,
      white: twColors.white,
      black: twColors.black,
      red: twColors.red,
      blue: {
        1: '#c0f9ff',
        2: '#55b2b0'
      },
      green: {
        DEFAULT: '#003a2f',
        1: '#d1f8ee',
        2: '#80c68c',
        3: '#2ea38d',
        4: '#caf1e7',
        5: '#92dbca',
        6: '#56b1af',
        7: '#56bab8'
      },
      orange: {
        DEFAULT: '#fab882'
      },
      turqoise: {
        DEFAULT: '#56c1bf'
      },
      pink: {
        DEFAULT: '#f38d94'
      },
      violet: {
        DEFAULT: '#8075ad'
      }
    },
    extend: {
      backgroundImage: {
        'gradient-primary': `linear-gradient(to right, #56AEAC, #8FD8C7)`,
        'gradient-secondary': `linear-gradient(to right, #E78CA3, #EFAB94)`,
        'gradient-overlay': `linear-gradient(270deg, #92DBCA 0.16%, #56B1AF 100%)`,
        'gradient-success': `linear-gradient(to right, #00A7CE 0%, #1AABC6 19.43%, #45B1B8 55.37%, #60B6B0 83.45%, #6AB7AD 100%)`,
        'gradient-error': `linear-gradient(to right, #E489A0 1.13%, #E99E96 58.42%, #ECA891 100%)`,
        'gradient-violet': `linear-gradient(to right, #9A8FCD, #9AB5D3)`,
        'gradient-pink': `linear-gradient(to right, #FF9DA9, #FFBFD3)`,
        'gradient-orange': `linear-gradient(to right, #FFB080, #E1CD96)`
      },
      screens: {
        'h-sm': { raw: '(min-height: 600px)' }
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}
