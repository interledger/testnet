/**
 * Runtime configuration for the wallet frontend.
 *
 * Every value here is read from the container environment when a request is
 * served, not when the image is built. A deployment changes a URL by editing
 * the ConfigMap and restarting the pod. The image never has to be rebuilt.
 *
 * Why these names carry no `NEXT_PUBLIC_` prefix
 * ---------------------------------------------
 * Next.js replaces every `process.env.NEXT_PUBLIC_*` expression with a string
 * literal at build time, in the client bundle and in the server bundle. A
 * prefixed name can therefore never change after `next build`. These names are
 * invisible to that substitution, so the server reads the real environment.
 *
 * The same applies to the `env` key in `next.config.js`, which is why that key
 * is gone. With `output: 'standalone'` the whole resolved config is serialised
 * into the generated `server.js`, so `publicRuntimeConfig` would freeze at
 * build time as well. Reading `process.env` directly is the only mechanism
 * that survives a standalone build.
 *
 * How a value reaches the browser
 * -------------------------------
 * The server reads `process.env`. `_document.tsx` writes the result into the
 * HTML of every response, and the browser reads it back from
 * `window.__WALLET_RUNTIME_CONFIG__`.
 *
 * This works only while every page is server rendered. `_app.tsx` defines
 * `getInitialProps` for that reason: it turns off Automatic Static
 * Optimization, which would otherwise bake the HTML of the pages that have no
 * `getServerSideProps` — `/404`, `/no-access` and `/auth/*` — at build time.
 */

export const RUNTIME_CONFIG_WINDOW_KEY = '__WALLET_RUNTIME_CONFIG__'

export type RuntimeConfig = {
  /**
   * The address the browser uses for the wallet backend.
   *
   * This may be an absolute URL (`https://api.example.dev`) when the backend
   * has a hostname of its own, or a path (`/wallet-api`) when one hostname
   * serves the frontend and the backend. A path needs no change when DNS
   * changes, so prefer it wherever the ingress routes both on one host.
   *
   * Server-side code must not use a path. Use `getServerBackendUrl()`, which
   * prefers the in-cluster address.
   */
  backendUrl: string
  openPaymentsHost: string
  authHost: string
  theme: string
  gatehubEnv: string
  featuresEnabled: boolean
}

const EMPTY_CONFIG: RuntimeConfig = {
  backendUrl: '',
  openPaymentsHost: '',
  authHost: '',
  theme: 'light',
  gatehubEnv: 'sandbox',
  featuresEnabled: false
}

/**
 * The guardrail that used to live in `next.config.js`. It stops the public
 * features turning themselves on in a sandbox environment when nobody sets
 * `FEATURES_ENABLED`.
 */
const resolveFeaturesEnabled = (gatehubEnv: string): boolean => {
  const explicit = process.env.FEATURES_ENABLED

  if (explicit) {
    return explicit === 'true'
  }

  return !(process.env.NODE_ENV === 'production' && gatehubEnv === 'sandbox')
}

/**
 * Reads the configuration from the environment. Server and Edge runtimes only.
 * On the client every value is empty, because the browser has no `process.env`
 * and Next.js inlines none of these names.
 */
export const readRuntimeConfigFromEnv = (): RuntimeConfig => {
  const gatehubEnv = process.env.GATEHUB_ENV || 'sandbox'

  return {
    backendUrl: process.env.BACKEND_URL ?? '',
    openPaymentsHost: process.env.OPEN_PAYMENTS_HOST ?? '',
    authHost: process.env.AUTH_HOST ?? '',
    theme: process.env.THEME || 'light',
    gatehubEnv,
    featuresEnabled: resolveFeaturesEnabled(gatehubEnv)
  }
}

/**
 * The address server-side code uses for the wallet backend.
 *
 * `BACKEND_INTERNAL_URL` keeps this traffic inside the cluster, and it is
 * required when `BACKEND_URL` is a path: server-side `fetch` cannot resolve a
 * path against an origin it does not have.
 */
export const getServerBackendUrl = (): string =>
  process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_URL || ''

export const getRuntimeConfig = (): RuntimeConfig => {
  if (typeof window === 'undefined') {
    return readRuntimeConfigFromEnv()
  }

  const injected = (
    window as unknown as Record<string, RuntimeConfig | undefined>
  )[RUNTIME_CONFIG_WINDOW_KEY]

  if (injected) {
    return injected
  }

  // Reached only if a page was served from HTML that `next build` produced,
  // which means Automatic Static Optimization came back on. See the note about
  // `_app.tsx` above.
  console.error(
    `[runtimeConfig] window.${RUNTIME_CONFIG_WINDOW_KEY} is missing. This page was not server rendered, so it has no configuration.`
  )

  return EMPTY_CONFIG
}
