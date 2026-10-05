/**
 * Entry point for the production image. A missing or malformed URL is a
 * deployment error, so fail here with a readable reason rather than serving
 * `undefined` inside every link. Runs before the `server.js` that `next build`
 * generates.
 */

const REQUIRED = ['BACKEND_URL', 'OPEN_PAYMENTS_HOST', 'AUTH_HOST']

const refuse = (reason) => {
  console.error(`[start] Refusing to start. ${reason}`)
  console.error(
    '[start] The Helm chart sets these from `config.frontend.urls` in the values file.'
  )
  process.exit(1)
}

const missing = REQUIRED.filter((name) => !process.env[name])

if (missing.length > 0) {
  refuse(`These environment variables are not set: ${missing.join(', ')}.`)
}

const isHttpUrl = (value) => {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

// A leading `//` is a protocol-relative URL pointing at another origin, not a
// path on this one.
const isOriginPath = (value) => value.startsWith('/') && !value.startsWith('//')

const backendUrl = process.env.BACKEND_URL

// Anything else — `api.example.test`, with no scheme — starts cleanly and then
// fails at the first request, in the browser and in SSR alike.
if (!isHttpUrl(backendUrl) && !isOriginPath(backendUrl)) {
  refuse(
    `BACKEND_URL is neither an absolute http(s) URL nor a path beginning with "/": ${backendUrl}`
  )
}

// A path resolves against the page origin, which the server does not have.
if (isOriginPath(backendUrl) && !process.env.BACKEND_INTERNAL_URL) {
  refuse(
    `BACKEND_URL is a path (${backendUrl}), so BACKEND_INTERNAL_URL must hold the absolute in-cluster address of the backend Service.`
  )
}

// Server-side only, so it is always absolute.
if (
  process.env.BACKEND_INTERNAL_URL &&
  !isHttpUrl(process.env.BACKEND_INTERNAL_URL)
) {
  refuse(
    `BACKEND_INTERNAL_URL is not an absolute http(s) URL: ${process.env.BACKEND_INTERNAL_URL}`
  )
}

// AUTH_HOST and OPEN_PAYMENTS_HOST are checked for presence only.
// OPEN_PAYMENTS_HOST is displayed as a wallet-address prefix and is a payment
// pointer in some environments (`$ilp.example.dev/`), not a URL.

require('./server.js')
