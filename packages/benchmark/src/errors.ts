import { OpenPaymentsClientError } from '@interledger/open-payments'
import type { FailureReason } from '@/types'

/**
 * Map an Open Payments client error to a benchmark {@link FailureReason} using
 * status code, GNAP error code and description heuristics.
 *
 * These reasons drive retry behaviour: `token_expired` triggers rotation,
 * `already_full` means the incoming payment is satisfied (stop), and the rest
 * are treated as transient-then-fatal via the failure budget.
 */
export function classifyError(err: unknown): FailureReason {
  if (!(err instanceof OpenPaymentsClientError)) {
    return 'other'
  }

  const description = (err.description || err.message || '').toLowerCase()
  const code = (err.code || '').toLowerCase()

  if (
    err.status === 401 ||
    code === 'invalid_token' ||
    description.includes('expired')
  ) {
    return 'token_expired'
  }
  if (description.includes('grant locked') || code === 'grant_locked') {
    return 'grant_locked'
  }
  if (description.includes('insufficient')) {
    return 'insufficient_liquidity'
  }
  if (
    description.includes('exceed') ||
    description.includes('completed') ||
    description.includes('already') ||
    description.includes('does not have a state that permits')
  ) {
    return 'already_full'
  }
  return 'other'
}

/** True when a grant continuation was attempted before the mandatory wait. */
export function isTooFast(err: unknown): boolean {
  return err instanceof OpenPaymentsClientError && err.code === 'too_fast'
}
