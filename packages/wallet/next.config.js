const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_BACKEND_URL:
      process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3003',
    NEXT_PUBLIC_USE_TEST_KYC_DATA:
      process.env.NEXT_PUBLIC_USE_TEST_KYC_DATA || 'true'
  }
}

module.exports = withBundleAnalyzer(nextConfig)
