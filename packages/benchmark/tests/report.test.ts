import { formatResult, formatScenario } from '@/report'
import type { BenchmarkResult, ScenarioSummary } from '@/types'

const summary: ScenarioSummary = {
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
  createLatencyMs: { count: 10, p50: 20, p95: 40, max: 60 }
}

describe('formatScenario', () => {
  it('renders headline metrics', () => {
    const text = formatScenario(summary)
    expect(text).toContain('alice → bob')
    expect(text).toContain('concluded:        yes')
    expect(text).toContain('10/10 succeeded')
    expect(text).toContain('time to conclude: 5.00s')
    expect(text).toContain('failures:         none')
    // settled value rendered as a grouped major-unit amount with asset code
    expect(text).toContain('settled value:    10.00 USD')
    // throughput expressed in comparable slices/s (10 slices over 5s = 2/s)
    expect(text).toContain('create rate:      5.00 slices/s')
    expect(text).toContain('settle rate:      2.00 slices/s')
  })

  it('renders failures and a non-concluded run', () => {
    const text = formatScenario({
      ...summary,
      concluded: false,
      failures: { grant_locked: 2, other: 1 }
    })
    expect(text).toContain('concluded:        NO')
    expect(text).toContain('grant_locked=2')
    expect(text).toContain('other=1')
  })
})

describe('formatResult', () => {
  it('renders a header and all scenarios', () => {
    const result: BenchmarkResult = {
      startedAt: '2026-07-13T00:00:00.000Z',
      finishedAt: '2026-07-13T00:01:00.000Z',
      scenarios: [summary, { ...summary, label: 'carol → dave' }]
    }
    const text = formatResult(result)
    expect(text).toContain('2 scenario(s)')
    expect(text).toContain('alice → bob')
    expect(text).toContain('carol → dave')
  })
})
