export const OPEN_PAYMENTS_HOST = process.env.NEXT_PUBLIC_OPEN_PAYMENTS_HOST
export const THEME = process.env.NEXT_PUBLIC_THEME
export const GATEHUB_ENV = process.env.NEXT_PUBLIC_GATEHUB_ENV
export const FEATURES_ENABLED =
  process.env.NEXT_PUBLIC_FEATURES_ENABLED === 'true' ? true : false
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
