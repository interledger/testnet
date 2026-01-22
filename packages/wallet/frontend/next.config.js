const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

// Default to env override; fall back to previous production/sandbox rule, then to 'true'
let NEXT_PUBLIC_FEATURES_ENABLED = process.env.NEXT_PUBLIC_FEATURES_ENABLED

if (!NEXT_PUBLIC_FEATURES_ENABLED) {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_GATEHUB_ENV === 'sandbox'
  ) {
    NEXT_PUBLIC_FEATURES_ENABLED = 'false'
  } else {
    NEXT_PUBLIC_FEATURES_ENABLED = 'true'
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_BACKEND_URL:
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003',
    // Internal URL for server-side (middleware) to reach backend in Docker
    BACKEND_INTERNAL_URL: process.env.BACKEND_URL || 'http://wallet-backend:3003',
    NEXT_PUBLIC_OPEN_PAYMENTS_HOST:
      process.env.NEXT_PUBLIC_OPEN_PAYMENTS_HOST || '$rafiki-backend/',
    NEXT_PUBLIC_AUTH_HOST:
      process.env.NEXT_PUBLIC_AUTH_HOST || 'http://localhost:3006',
    NEXT_PUBLIC_THEME: process.env.NEXT_PUBLIC_THEME || 'light',
    NEXT_PUBLIC_GATEHUB_ENV: process.env.NEXT_PUBLIC_GATEHUB_ENV || 'sandbox',
    NEXT_PUBLIC_FEATURES_ENABLED
  }
}

module.exports = withBundleAnalyzer(nextConfig)
