import type { BenchmarkResult, PaymentSample } from '@/types'

/**
 * Column order for the per-payment CSV. Each `*_ms` column is an integer
 * millisecond count; blanks mean "not applicable" (e.g. `create_ms` is blank
 * when the attempt failed while quoting, `settle_ms` is blank unless settlement
 * latency was measured).
 */
const COLUMNS = [
  'scenario',
  'attempt',
  'worker',
  'offset_ms',
  'quote_ms',
  'create_ms',
  'settle_ms',
  'total_ms',
  'outcome',
  'failed_state',
  'error_reason',
  'error_detail'
] as const

/** Escape a single CSV field per RFC 4180 (quote only when necessary). */
function csvField(value: string | number | undefined): string {
  if (value === undefined) {
    return ''
  }
  const s = String(value)
  return /["\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** One data row, in {@link COLUMNS} order. */
function row(s: PaymentSample): string {
  return [
    s.scenario,
    s.attempt,
    s.worker,
    s.offsetMs,
    s.quoteMs,
    s.createMs,
    s.settleMs,
    s.totalMs,
    s.outcome,
    s.failedState,
    s.errorReason,
    s.errorDetail
  ]
    .map(csvField)
    .join(',')
}

/**
 * A commented legend block describing the run and every column, emitted at the
 * top of the CSV so the file is self-documenting. Lines start with `#`; skip
 * them when plotting (e.g. `pandas.read_csv(path, comment='#')`).
 */
function legend(result: BenchmarkResult): string[] {
  const scenarioKey = result.scenarios.map(
    (sc, i) =>
      `#   ${i + 1}  ${sc.fromWalletAddress} → ${sc.toWalletAddress}  (${sc.assetCode})`
  )
  return [
    '# Open Payments benchmark — per-payment CSV',
    `# run ${result.startedAt} → ${result.finishedAt}`,
    '#',
    '# One row per payment ATTEMPT (a single quote+create cycle) as the benchmark',
    '# client observed it. Retries (after a token refresh or a timeout re-queue) are',
    '# recorded as separate attempts/rows. All *_ms values are integer milliseconds.',
    '#',
    '# Scenarios:',
    ...scenarioKey,
    '#',
    '# Columns:',
    '#   scenario      scenario id (see Scenarios above)',
    '#   attempt       attempt number within the scenario (unique, monotonic; includes retries)',
    '#   worker        zero-based worker that made the attempt',
    '#   offset_ms     ms from the scenario start to when this attempt began (use as the time axis)',
    '#   quote_ms      ms in the QUOTE state (≈0 when skip-quote is enabled)',
    '#   create_ms     ms in the CREATE state (outgoing-payment create)',
    '#   settle_ms     ms from create to fully sent (blank unless settleLatency is enabled)',
    '#   total_ms      quote_ms + create_ms (client time to the end state)',
    '#   outcome       success | failure',
    '#   failed_state  on failure, the state it failed in: quote | create (blank on success)',
    '#   error_reason  on failure: token_expired | grant_locked | insufficient_liquidity | already_full | other',
    '#                 (token_expired is transient — the slice was re-queued; blank on success)',
    '#   error_detail  on failure: HTTP status / GNAP code / description — a request timeout shows here',
    '#                 (blank on success)',
    '#',
    "# Tip: skip these comment lines when plotting, e.g. pandas.read_csv(path, comment='#').",
    '#'
  ]
}

/**
 * Render the per-payment samples as a CSV document: a commented legend, the
 * header row, then one row per attempt, sorted by scenario then start time so
 * the file reads chronologically within each scenario.
 */
export function formatCsv(
  result: BenchmarkResult,
  samples: PaymentSample[]
): string {
  const sorted = [...samples].sort(
    (a, b) =>
      a.scenario - b.scenario ||
      a.offsetMs - b.offsetMs ||
      a.attempt - b.attempt
  )
  const lines = [
    ...legend(result),
    COLUMNS.join(','),
    ...sorted.map(row)
  ]
  return `${lines.join('\n')}\n`
}
