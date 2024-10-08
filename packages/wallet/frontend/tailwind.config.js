const plugin = require('tailwindcss/plugin')
const twColors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: twColors.transparent,
      white: 'rgb(var(--white) / <alpha-value>)',
      black: 'rgb(var(--black) / <alpha-value>)',
      grey: {
        light: 'rgb(var(--grey-light) / <alpha-value>)',
        dark: 'rgb(var(--grey-dark) / <alpha-value>)'
      },
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
      boxShadow: {
        'glow-button': [
          '0 0 0.2rem #ffffff',
          '0 0 0.4rem #ffffff',
          '0 0 1rem #da35ba',
          '0 0 0.4rem #da35ba',
          '0 0 1.4rem #da35ba',
          'inset 0 0 0.6rem #da35ba'
        ],
        'glow-link': [
          '0 0 0.2rem #ffffff',
          '0 0 0.2rem #ffffff',
          '0 0 1rem #da35ba',
          '0 0 0.4rem #da35ba',
          'inset 0 0 0.6rem #da35ba'
        ]
      },
      dropShadow: {
        'glow-svg': [
          '0 0 0.2rem #fff',
          '0 0 1rem rgb(var(--pink-neon))',
          '0 0 0.4rem rgb(var(--pink-neon))'
        ],
        'glow-svg-green': [
          '0 0 0.2rem #fff',
          '0 0 0.2rem rgb(var(--green-dark))',
          '0 0 1rem rgb(var(--green-dark))'
        ],
        'glow-svg-orange': [
          '0 0 0.2rem #fff',
          '0 0 0.2rem rgb(var(--orange-dark))',
          '0 0 1rem rgb(var(--orange-dark))'
        ]
      },
      screens: {
        'h-sm': { raw: '(min-height: 600px)' }
      }
    },
    plugins: [require('@tailwindcss/forms'), require('tailwindcss-animate')]
  }
}
