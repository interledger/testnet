/**
 * Default values for countries and documents
 */
export const USE_TEST_DATA_KYC =
  process.env.NEXT_PUBLIC_USE_TEST_KYC_DATA === 'true'
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png']

export const OPEN_PAYMENTS_HOST = process.env.NEXT_PUBLIC_OPEN_PAYMENTS_HOST

/**
 * Default text for Toggle Switch
 */
export const PAYMENT_SEND = 'send'
export const PAYMENT_RECEIVE = 'receive'

// Default ILC Wallet Address for onboarding
export const INTERLEDGER_WALLET_ADDRESS = '$ilp.rafiki.money/interledger'

// Default number of grants to be shown on page
export const GRANTS_DISPLAY_NR = 10

//Default Base64 encoded Public Key
export const BASE64_PUBLIC_KEY =
  'ewogICJrdHkiOiAiT0tQIiwKICAiY3J2IjogIkVkMjU1MTkiLAogICJraWQiOiAidGVzdC1rZXktZWQyNTUxOSIsCiAgIngiOiAiSnJRTGo1UF84OWlYRVM5LXZGZ3JJeTI5Y2xGOUNDX29QUHN3M2M1RDBicyIKfQ=='

export const MAX_ASSET_SCALE = 9
export const BASE_ASSET_SCALE = 2
