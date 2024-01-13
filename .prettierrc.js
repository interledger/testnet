/** @type {import("prettier").Config} */
module.exports = {
  printWidth: 80,
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  quoteProps: 'consistent',
  jsxSingleQuote: false,
  trailingComma: 'none',
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindConfig: './packages/wallet/frontend/tailwind.config.js'
}
