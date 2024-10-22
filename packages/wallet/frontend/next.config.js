const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

let NEXT_PUBLIC_FEATURES_ENABLED = 'true'

if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_GATEHUB_ENV === 'sandbox'
) {
  NEXT_PUBLIC_FEATURES_ENABLED = 'false'
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_BACKEND_URL:
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003',
    NEXT_PUBLIC_OPEN_PAYMENTS_HOST:
      process.env.NEXT_PUBLIC_OPEN_PAYMENTS_HOST || '$rafiki-backend/',
    NEXT_PUBLIC_AUTH_HOST:
      process.env.NEXT_PUBLIC_AUTH_HOST || 'http://localhost:3006',
    NEXT_PUBLIC_THEME: process.env.NEXT_PUBLIC_THEME || 'dark',
    NEXT_PUBLIC_FEATURES_ENABLED
  }
}

module.exports = withBundleAnalyzer(nextConfig)
