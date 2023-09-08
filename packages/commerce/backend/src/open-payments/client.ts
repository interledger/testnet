import { Env } from '@/config/env'
import { createAuthenticatedClient } from '@interledger/open-payments'

export async function createOpenPaymentsClient(env: Env) {
  const privateKey = Buffer.from(env.PRIVATE_KEY, 'base64')
  const client = await createAuthenticatedClient({
    keyId: env.KEY_ID,
    privateKey,
    paymentPointerUrl: env.PAYMENT_POINTER
  })

  return client
}
