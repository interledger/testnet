/**
 * Entry point for the production image. A missing URL is a deployment error,
 * so fail here with a readable reason rather than serving `undefined` inside
 * every link. Runs before the `server.js` that `next build` generates.
 */

const REQUIRED = ['BACKEND_URL', 'OPEN_PAYMENTS_HOST', 'AUTH_HOST']

const missing = REQUIRED.filter((name) => !process.env[name])

if (missing.length > 0) {
  console.error(
    `[start] Refusing to start. These environment variables are not set: ${missing.join(', ')}.\n` +
      '[start] The Helm chart sets them from `config.frontend.urls` in the values file.'
  )
  process.exit(1)
}

// A path resolves against the page origin, which the server does not have.
if (
  process.env.BACKEND_URL.startsWith('/') &&
  !process.env.BACKEND_INTERNAL_URL
) {
  console.error(
    `[start] Refusing to start. BACKEND_URL is a path (${process.env.BACKEND_URL}), so BACKEND_INTERNAL_URL must hold the absolute in-cluster address of the backend Service.`
  )
  process.exit(1)
}

require('./server.js')
