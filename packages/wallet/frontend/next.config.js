const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

// No `env` and no `publicRuntimeConfig` on purpose: both resolve at build time,
// which is what tied a deployment URL to an image tag. The frontend reads
// `process.env` per request instead — see src/lib/runtimeConfig.ts, and
// scripts/start.js for the start-up check.

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // ESLint 9.x removed options (useEslintrc, extensions) that Next.js 14
  // passes internally. Linting is handled separately via `pnpm lint:check`.
  eslint: { ignoreDuringBuilds: true }
}

module.exports = withBundleAnalyzer(nextConfig)
