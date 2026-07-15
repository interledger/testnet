import type { WalletAddress } from '@interledger/open-payments'
import type { Amount, CachedGrant } from '@/types'
import type { BenchmarkClient } from '@/open-payments'
import { isTooFast } from '@/errors'
import { sleep as realSleep, type Sleep } from '@/util'

export interface ObtainGrantDeps {
  client: BenchmarkClient
  payer: WalletAddress
  debitAmount: Amount
  /**
   * Optional ISO8601 repeating interval making the grant recurring, so its
   * `debitAmount` allowance resets each period and the grant is reusable across
   * runs rather than single-use. See {@link BenchmarkClient.requestOutgoingPaymentGrant}.
   */
  interval?: string
  /** Called with the consent URL the user must open in a browser. */
  prompt: (redirectUrl: string) => void
  /** Optional progress logger. */
  log?: (message: string) => void
  sleep?: Sleep
  /** Overall timeout for the human to approve, in ms. Default 5 minutes. */
  timeoutMs?: number
  /** Injectable clock for the timeout, in ms. Default Date.now. */
  now?: () => number
}

/**
 * Obtain an approved outgoing-payment grant for `payer` using interactive,
 * poll-based GNAP continuation — the same flow for local and real testnet, with
 * no browser automation. Requests the grant, prints the consent URL, then polls
 * the continuation until the resource owner approves (or the timeout elapses).
 */
export async function obtainGrant(deps: ObtainGrantDeps): Promise<CachedGrant> {
  const sleep = deps.sleep ?? realSleep
  const now = deps.now ?? Date.now
  const timeoutMs = deps.timeoutMs ?? 5 * 60 * 1000
  const log = deps.log ?? (() => {})

  const pending = await deps.client.requestOutgoingPaymentGrant({
    payer: deps.payer,
    debitAmount: deps.debitAmount,
    interval: deps.interval
  })

  deps.prompt(pending.redirect)

  const deadline = now() + timeoutMs
  // GNAP requires waiting for the grant's `wait` period before continuing.
  let waitMs = Math.max(pending.wait, 1) * 1000

  while (now() < deadline) {
    await sleep(waitMs)
    try {
      const approved = await deps.client.continueGrant(
        pending.continueUri,
        pending.continueToken
      )
      if (approved) {
        log('Grant approved.')
        return {
          accessToken: approved.accessToken,
          manageUrl: approved.manageUrl,
          continueUri: pending.continueUri
        }
      }
      log('Grant not yet approved; waiting…')
    } catch (err) {
      if (isTooFast(err)) {
        waitMs = Math.max(waitMs, 1000)
        continue
      }
      throw err
    }
  }

  throw new Error('Timed out waiting for the grant to be approved.')
}
