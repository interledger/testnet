/** @type {import("prettier").Config} */
module.exports = {
  printWidth: 80,
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  quoteProps: 'consistent',
  jsxSingleQuote: false,
  trailingComma: 'none',
  pluginSearchDirs: false,
  /**
   * This plugin is going automatically sort Tailwind's classes, following
   * it's recommended class order.
   *
   * https://tailwindcss.com/blog/automatic-class-sorting-with-prettier
   */
  plugins: [require('prettier-plugin-tailwindcss')],
  tailwindConfig: './packages/wallet-frontend/tailwind.config.js'
}
