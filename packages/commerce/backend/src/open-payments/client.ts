import { Env } from '@/config/env'
// import { InternalServerError } from '@/errors'
import { parseOrProvisionKey } from '@/shared/utils'
import { createAuthenticatedClient } from '@interledger/open-payments'
import { join } from 'path'

export async function createOpenPaymentsClient(env: Env) {
  const privateKey = parseOrProvisionKey(
    join(__dirname, '..', '..', env.PRIVATE_KEY)
  )
  const client = await createAuthenticatedClient({
    keyId: env.KEY_ID,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    privateKey,
    paymentPointerUrl: env.PAYMENT_POINTER
  })

  return client
}
