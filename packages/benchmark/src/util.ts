/** Small dependency-injectable helpers, isolated so tests can stub them. */

/** Resolve after `ms` milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** A clock function; injectable so tests can supply deterministic timestamps. */
export type Clock = () => number

/** A sleep function; injectable so tests can avoid real timers. */
export type Sleep = (ms: number) => Promise<void>

/**
 * The nearest-rank percentile of a set of numbers. Returns 0 for an empty set.
 * `p` is a percentage in [0, 100].
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0
  }
  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.ceil((p / 100) * sorted.length)
  const index = Math.min(sorted.length - 1, Math.max(0, rank - 1))
  return sorted[index]
}

/** The maximum of a set of numbers, or 0 for an empty set. */
export function max(values: number[]): number {
  return values.reduce((acc, v) => (v > acc ? v : acc), 0)
}
