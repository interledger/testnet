/**
 * Configuration read from the container environment per request, not baked in
 * at build time. A deployment changes a URL by editing the ConfigMap and
 * restarting the pod.
 *
 * The names carry no `NEXT_PUBLIC_` prefix because Next.js replaces those with
 * literals at build time. The same goes for `next.config.js`'s `env` key, and
 * for `publicRuntimeConfig` under `output: 'standalone'`, which serialises the
 * resolved config into the generated `server.js`.
 *
 * The server reads `process.env`; `_document.tsx` writes the result into every
 * response and the browser reads it back. That needs every page server
 * rendered, which is why `_app.tsx` defines `getInitialProps`.
 */

export const RUNTIME_CONFIG_WINDOW_KEY = '__WALLET_RUNTIME_CONFIG__'

export type RuntimeConfig = {
  /**
   * The backend address the browser uses. Either absolute, or a path such as
   * `/wallet-api` where one hostname serves both halves of the wallet. Server
   * code must use `getServerBackendUrl()`, which cannot resolve a path.
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

// Guardrail moved from next.config.js: public features stay off in a sandbox
// unless something sets FEATURES_ENABLED.
const resolveFeaturesEnabled = (gatehubEnv: string): boolean => {
  const explicit = process.env.FEATURES_ENABLED

  if (explicit) {
    return explicit === 'true'
  }

  return !(process.env.NODE_ENV === 'production' && gatehubEnv === 'sandbox')
}

/** Server and Edge runtimes only. Every value is empty in the browser. */
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
 * The backend address server-side code uses. `BACKEND_INTERNAL_URL` keeps the
 * traffic in-cluster, and is required when `BACKEND_URL` is a path.
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

  // Only reachable if the page came from build-time HTML, which means static
  // optimization is back on.
  console.error(
    `[runtimeConfig] window.${RUNTIME_CONFIG_WINDOW_KEY} is missing. This page was not server rendered, so it has no configuration.`
  )

  return EMPTY_CONFIG
}
