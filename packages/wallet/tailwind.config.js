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
        DEFAULT: '#003a2f', // 4
        1: '#d1f8ee',
        2: '#80c68c',
        3: '#2ea38d',
        4: '#caf1e7', // 5
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
        'gradient-orange': '',
        'gradient-pink': '',
        'gradient-violet': ''
      },
      screens: {
        'h-sm': { raw: '(min-height: 600px)' }
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}
// backgroundImage: `linear-gradient(to bottom right, ${theme('colors.orange.300')}, ${theme('colors.rose.500')})`

// ul bleu color #C0F9FF,10:48Background ul verde de la KYC #D1F8EE10:49Verdele din text #2EA38D10:50Verde inchis din text #003A2F10:51Turcoaz din pagina de account, practic culorile de la account: #56C1BF10:52Portocaliu #FAB88210:52Roz #F38D9410:54Galben #EFDBA410:55Verde deschis de la account #80C68C
