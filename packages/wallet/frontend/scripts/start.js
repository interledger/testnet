/**
 * Entry point for the production image.
 *
 * The frontend reads its URLs from the environment when it serves a request,
 * so a missing variable is a deployment error, not a build error. This check
 * turns that error into a pod that fails to start with a readable reason. The
 * alternative is a pod that starts and serves `undefined` inside every link.
 *
 * Run before `server.js`, which is the file `next build` generates for
 * `output: 'standalone'`.
 */

// Read by the browser, through the script `_document.tsx` writes into the page.
const REQUIRED = ['BACKEND_URL', 'OPEN_PAYMENTS_HOST', 'AUTH_HOST']

const missing = REQUIRED.filter((name) => !process.env[name])

if (missing.length > 0) {
  console.error(
    `[start] Refusing to start. These environment variables are not set: ${missing.join(', ')}.\n` +
      '[start] The Helm chart sets them from `config.frontend.urls` in the values file.'
  )
  process.exit(1)
}

// A path means "the same origin as the page". The browser resolves it, the
// server cannot, so the server needs an absolute address of its own.
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
