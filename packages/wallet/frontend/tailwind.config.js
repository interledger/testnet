const twColors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: twColors.transparent,
      white: twColors.white,
      black: 'rgb(var(--black) / <alpha-value>)',
      purple: {
        DEFAULT: 'rgb(var(--purple) / <alpha-value>)',
        bright: 'rgb(var(--purple-bright) / <alpha-value>)',
        dark: 'rgb(var(--purple-dark) / <alpha-value>)'
      },
      pink: {
        light: 'rgb(var(--pink-light) / <alpha-value>)',
        dark: 'rgb(var(--pink-dark) / <alpha-value>)',
        neon: 'rgb(var(--pink-neon) / <alpha-value>)'
      },
      teal: {
        light: 'rgb(var(--teal-light) / <alpha-value>)',
        neon: 'rgb(var(--teal-neon) / <alpha-value>)'
      },
      green: {
        DEFAULT: 'rgb(var(--green) / <alpha-value>)',
        light: 'rgb(var(--green-light) / <alpha-value>)',
        bright: 'rgb(var(--green-bright) / <alpha-value>)',
        dark: 'rgb(var(--green-dark) / <alpha-value>)',
        neon: 'rgb(var(--green-neon) / <alpha-value>)',
        modal: 'rgb(var(--green-modal) / <alpha-value>)'
      },
      yellow: {
        light: 'rgb(var(--yellow-light) / <alpha-value>)',
        neon: 'rgb(var(--yellow-neon) / <alpha-value>)'
      },
      orange: {
        dark: 'rgb(var(--orange-dark) / <alpha-value>)'
      }
    },
    extend: {
      backgroundImage: {
        'gradient-primary': `linear-gradient(to right, #56AEAC, #8FD8C7)`,
        'gradient-primary-dark': `linear-gradient(to right, #7acebe, #2b7576)`,
        'gradient-secondary': `linear-gradient(to right, #E78CA3, #EFAB94)`,
        'gradient-secondary-dark': `linear-gradient(to right, #d85b7d, #df7754)`,
        'gradient-overlay': `linear-gradient(270deg, #92DBCA 0.16%, #56B1AF 100%)`,
        'gradient-success': `linear-gradient(to right, #00A7CE 0%, #1AABC6 19.43%, #45B1B8 55.37%, #60B6B0 83.45%, #6AB7AD 100%)`,
        'gradient-error': `linear-gradient(to right, #E489A0 1.13%, #E99E96 58.42%, #ECA891 100%)`,
        'gradient-violet': `linear-gradient(to right, #9A8FCD, #9AB5D3)`,
        'gradient-pink': `linear-gradient(to right, #FF9DA9, #FFBFD3)`,
        'gradient-orange': `linear-gradient(to right, #FFB080, #E1CD96)`,
        'gradient-backdrop': `linear-gradient(to right, #56B1AFE6, #92DBCAE6, #56B1AFE6)`
      },
      screens: {
        'h-sm': { raw: '(min-height: 600px)' }
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('tailwindcss-animate')]
}
