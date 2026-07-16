import { formatCsv } from '@/csv'
import type { BenchmarkResult, PaymentSample, ScenarioSummary } from '@/types'

const scenarioSummary = (
  over: Partial<ScenarioSummary> = {}
): ScenarioSummary => ({
  label: 'alice → bob',
  fromWalletAddress: 'https://wallet/alice',
  toWalletAddress: 'https://wallet/bob',
  targetSlices: 10,
  assetCode: 'USD',
  assetScale: 2,
  succeeded: 10,
  failures: {},
  concluded: true,
  settledValue: '1000',
  submitMs: 2000,
  settleMs: 5000,
  createsPerSecond: 5,
  settledPerSecond: 200,
  quoteLatencyMs: { count: 10, p50: 12, p95: 30, max: 45 },
  createLatencyMs: { count: 10, p50: 20, p95: 40, max: 60 },
  ...over
})

const result: BenchmarkResult = {
  startedAt: '2026-01-01T00:00:00.000Z',
  finishedAt: '2026-01-01T00:01:00.000Z',
  scenarios: [scenarioSummary()]
}

const success: PaymentSample = {
  scenario: 1,
  attempt: 1,
  worker: 0,
  offsetMs: 0,
  quoteMs: 120,
  createMs: 200,
  totalMs: 320,
  outcome: 'success'
}

const failure: PaymentSample = {
  scenario: 1,
  attempt: 2,
  worker: 1,
  offsetMs: 500,
  quoteMs: 90,
  createMs: 5002,
  totalMs: 5092,
  outcome: 'failure',
  failedState: 'create',
  errorReason: 'other',
  errorDetail:
    'status=400 code=invalid_request description=receiver, amount and method are required'
}

/** Non-comment, non-blank lines split into fields (skips the legend). */
function dataRows(csv: string): string[] {
  return csv
    .split('\n')
    .filter((l) => l.length > 0 && !l.startsWith('#'))
}

describe('formatCsv', () => {
  it('emits a commented legend describing the run and every column', () => {
    const csv = formatCsv(result, [success])
    const legend = csv.split('\n').filter((l) => l.startsWith('#'))
    expect(legend.join('\n')).toContain('per-payment CSV')
    // Every column is documented in the legend.
    for (const col of [
      'scenario',
      'offset_ms',
      'quote_ms',
      'create_ms',
      'settle_ms',
      'total_ms',
      'outcome',
      'failed_state',
      'error_reason',
      'error_detail'
    ]) {
      expect(legend.some((l) => l.includes(col))).toBe(true)
    }
    // The scenario key maps the id to its wallet addresses.
    expect(legend.join('\n')).toContain('https://wallet/alice → https://wallet/bob')
  })

  it('writes the header row followed by one row per sample', () => {
    const rows = dataRows(formatCsv(result, [success, failure]))
    expect(rows[0]).toBe(
      'scenario,attempt,worker,offset_ms,quote_ms,create_ms,settle_ms,total_ms,outcome,failed_state,error_reason,error_detail'
    )
    expect(rows).toHaveLength(3) // header + 2 samples
  })

  it('renders a success row with blank error and settle columns', () => {
    const rows = dataRows(formatCsv(result, [success]))
    // header index 0, first sample index 1
    expect(rows[1]).toBe('1,1,0,0,120,200,,320,success,,,')
  })

  it('quotes error detail containing commas and reports the failed state', () => {
    const rows = dataRows(formatCsv(result, [failure]))
    const row = rows[1]
    expect(row).toContain('failure,create,other,')
    // The comma-bearing detail must be wrapped in quotes.
    expect(row).toContain(
      '"status=400 code=invalid_request description=receiver, amount and method are required"'
    )
  })

  it('emits settle_ms when present', () => {
    const rows = dataRows(formatCsv(result, [{ ...success, settleMs: 1500 }]))
    expect(rows[1]).toBe('1,1,0,0,120,200,1500,320,success,,,')
  })

  it('sorts rows by scenario then start offset', () => {
    const later = { ...success, attempt: 5, offsetMs: 900 }
    const earlier = { ...success, attempt: 6, offsetMs: 100 }
    const rows = dataRows(
      formatCsv(
        { ...result, scenarios: [scenarioSummary(), scenarioSummary()] },
        [
          { ...later, scenario: 2 },
          later,
          earlier
        ]
      )
    )
    // Within scenario 1, the earlier offset (100) comes before the later (900);
    // scenario 2 comes last.
    expect(rows[1].startsWith('1,6,0,100')).toBe(true)
    expect(rows[2].startsWith('1,5,0,900')).toBe(true)
    expect(rows[3].startsWith('2,')).toBe(true)
  })
})
