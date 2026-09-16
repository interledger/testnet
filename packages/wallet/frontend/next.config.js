const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

// This file deliberately declares no `env` and no `publicRuntimeConfig`.
//
// Both are resolved when the image is built. `env` is inlined into the bundles
// by webpack, and with `output: 'standalone'` the whole resolved config —
// `publicRuntimeConfig` included — is serialised into the generated
// `server.js`. Either one would tie a URL to an image tag again.
//
// The frontend reads its configuration from `process.env` while it serves a
// request instead. See `src/lib/runtimeConfig.ts`, and
// `scripts/start.js` for the check that runs before the server accepts
// traffic.

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // ESLint 9.x removed options (useEslintrc, extensions) that Next.js 14
  // passes internally. Linting is handled separately via `pnpm lint:check`.
  eslint: { ignoreDuringBuilds: true }
}

module.exports = withBundleAnalyzer(nextConfig)
