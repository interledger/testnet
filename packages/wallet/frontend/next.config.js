const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_BACKEND_URL:
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3053',
    NEXT_PUBLIC_USE_TEST_KYC_DATA:
      process.env.NEXT_PUBLIC_USE_TEST_KYC_DATA || 'true',
    NEXT_PUBLIC_OPEN_PAYMENTS_HOST:
      process.env.NEXT_PUBLIC_OPEN_PAYMENTS_HOST || '$rafiki-backend/',
    NEXT_PUBLIC_AUTH_HOST:
      process.env.NEXT_PUBLIC_AUTH_HOST || 'http://localhost:3056'
  }
}

module.exports = withBundleAnalyzer(nextConfig)
