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

// Default ILC Payment Pointer for onboarding
export const INTERLEDGER_PAYMENT_POINTER =
  '$ilp.rafiki.money/interledger'
