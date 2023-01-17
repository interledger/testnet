/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "2020",
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: ["react", "@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }
    ]
  },
  ignorePatterns: ["**/*.js", "**/*.json", "node_modules", "dist"],
  settings: {
    react: {
      version: "detect"
    }
  }
}
