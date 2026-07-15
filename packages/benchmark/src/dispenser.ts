/**
 * A reservation-based ticket dispenser that guarantees exactly `target`
 * successful slices are delivered, even under concurrency and retries.
 *
 * A worker {@link claim}s a reservation before attempting a slice. On success
 * it {@link confirm}s (the reservation is consumed); on a retryable failure it
 * {@link release}s the reservation back into the pool so another attempt is
 * made. Because the number of live reservations never exceeds `target`, workers
 * can never over-issue payments past the incoming payment's fixed amount (which
 * would otherwise be clamped/rejected by the receiver).
 */
export class Dispenser {
  private _remaining: number
  private _inflight = 0
  private _confirmed = 0

  constructor(target: number) {
    if (!Number.isInteger(target) || target < 0) {
      throw new Error(
        `Dispenser target must be a non-negative integer, got ${target}`
      )
    }
    this._remaining = target
  }

  /** Reserve a slice. Returns false when none are currently available. */
  claim(): boolean {
    if (this._remaining <= 0) {
      return false
    }
    this._remaining -= 1
    this._inflight += 1
    return true
  }

  /** Mark a reserved slice as successfully delivered. */
  confirm(): void {
    if (this._inflight <= 0) {
      throw new Error('confirm() called without an outstanding reservation')
    }
    this._inflight -= 1
    this._confirmed += 1
  }

  /** Return a reserved slice to the pool so it can be retried. */
  release(): void {
    if (this._inflight <= 0) {
      throw new Error('release() called without an outstanding reservation')
    }
    this._inflight -= 1
    this._remaining += 1
  }

  /** True once every slice has been confirmed (nothing left to claim or in flight). */
  get done(): boolean {
    return this._remaining === 0 && this._inflight === 0
  }

  get remaining(): number {
    return this._remaining
  }

  get inflight(): number {
    return this._inflight
  }

  get confirmed(): number {
    return this._confirmed
  }
}
