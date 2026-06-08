const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
  throw new Error(
    'Missing required environment variable: NEXT_PUBLIC_BACKEND_URL'
  )
}

// Default to env override; fall back to previous production/sandbox rule, then to 'true'
let NEXT_PUBLIC_FEATURES_ENABLED = process.env.NEXT_PUBLIC_FEATURES_ENABLED

// This is a gaurdrail to prevent accidentally enabling features in production when the
// env variable is not set.
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
  // ESLint 9.x removed options (useEslintrc, extensions) that Next.js 14
  // passes internally. Linting is handled separately via `pnpm lint:check`.
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_OPEN_PAYMENTS_HOST: process.env.NEXT_PUBLIC_OPEN_PAYMENTS_HOST,
    NEXT_PUBLIC_AUTH_HOST: process.env.NEXT_PUBLIC_AUTH_HOST,
    NEXT_PUBLIC_THEME: process.env.NEXT_PUBLIC_THEME || 'light',
    NEXT_PUBLIC_GATEHUB_ENV: process.env.NEXT_PUBLIC_GATEHUB_ENV || 'sandbox',
    NEXT_PUBLIC_FEATURES_ENABLED
  }
  // NOTE: `BACKEND_INTERNAL_URL` is deliberately NOT listed here. Listing it
  // would inline its build-time value into the server bundle (including the
  // edge middleware), making it impossible to configure per deployment. It is
  // instead read from the runtime container environment in `lib/httpClient.ts`,
  // which only runs in the Node.js runtime (server data fetching).
}

module.exports = withBundleAnalyzer(nextConfig)
