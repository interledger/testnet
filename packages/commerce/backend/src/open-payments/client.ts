import { Env } from '@/config/env'
// import { InternalServerError } from '@/errors'
// import { parseKey } from '@/shared/utils'
import { createAuthenticatedClient } from '@interledger/open-payments'

export async function createOpenPaymentsClient(env: Env) {
  const privateKey =
    '-----BEGIN PRIVATE KEY-----MC4CAQAwBQYDK2VwBCIEII/0EKsAD/C0Gvj7dANexC+wrHAt6ZgatsOfHO6aZZ6F-----END PRIVATE KEY-----'

  const client = await createAuthenticatedClient({
    keyId: env.KEY_ID,
    privateKey,
    paymentPointerUrl: env.PAYMENT_POINTER
  })

  return client
}
