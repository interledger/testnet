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
    description.includes('expired') ||
    // Rafiki returns 403 "Inactive Token" (not 401) once an access token has
    // expired or been revoked; treat it as expiry so the runner rotates. Match
    // the specific phrase so a generic 403 "unauthorized" (grant limit) or an
    // "inactive wallet address" (400) is NOT mistaken for a token issue.
    description.includes('inactive token')
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

/**
 * Render an error into a single diagnostic line, pulling the status, GNAP code,
 * description and any validation errors out of an {@link OpenPaymentsClientError}
 * (whose default `message` is just "Error making Open Payments POST request").
 */
export function describeError(err: unknown): string {
  if (err instanceof OpenPaymentsClientError) {
    const parts = [
      err.status !== undefined ? `status=${err.status}` : undefined,
      err.code ? `code=${err.code}` : undefined,
      err.description ? `description=${err.description}` : undefined,
      err.validationErrors?.length
        ? `validation=${err.validationErrors.join('; ')}`
        : undefined
    ].filter(Boolean)
    return parts.length ? parts.join(' ') : err.message
  }
  return err instanceof Error ? err.message : String(err)
}
