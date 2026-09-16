import { getRuntimeConfig } from '@/lib/runtimeConfig'

// Read once per bundle. On the server this happens when the module is first
// imported, and the pod environment does not change while the process runs. In
// the browser it happens after the inline script in `_document.tsx` has run,
// because that script is written ahead of every Next.js bundle in the body.
const runtimeConfig = getRuntimeConfig()

export const BACKEND_URL = runtimeConfig.backendUrl
export const AUTH_HOST = runtimeConfig.authHost
export const OPEN_PAYMENTS_HOST = runtimeConfig.openPaymentsHost
export const THEME = runtimeConfig.theme
export const GATEHUB_ENV = runtimeConfig.gatehubEnv
export const FEATURES_ENABLED = runtimeConfig.featuresEnabled
export const DEPOSITS_ENABLED = GATEHUB_ENV !== 'production'
/**
 * Default text for Toggle Switch
 */
export const PAYMENT_SEND = 'send'
export const PAYMENT_RECEIVE = 'receive'

// Default ILC Wallet Address for onboarding
export const INTERLEDGER_WALLET_ADDRESS =
  '$ilp.interledger-test.dev/interledger'

// Default number of grants to be shown on page
export const GRANTS_DISPLAY_NR = 10

//Default Base64 encoded Public Key
export const BASE64_PUBLIC_KEY =
  'ewogICJrdHkiOiAiT0tQIiwKICAiY3J2IjogIkVkMjU1MTkiLAogICJraWQiOiAidGVzdC1rZXktZWQyNTUxOSIsCiAgIngiOiAiSnJRTGo1UF84OWlYRVM5LXZGZ3JJeTI5Y2xGOUNDX29QUHN3M2M1RDBicyIKfQ=='

export const BASE_ASSET_SCALE = 2
