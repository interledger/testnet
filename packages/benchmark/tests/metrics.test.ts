import { ScenarioMetrics } from '@/metrics'

const meta = {
  label: 'alice → bob',
  fromWalletAddress: 'https://wallet/alice',
  toWalletAddress: 'https://wallet/bob',
  targetSlices: 10,
  assetCode: 'USD',
  assetScale: 2
}

/** A controllable clock that returns queued timestamps. */
function scriptedClock(values: number[]): () => number {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}

describe('ScenarioMetrics', () => {
  it('summarises a clean run', () => {
    // now() calls: start=0, then recordSuccess doesn't call now, markSubmitted=2000, markSettled=5000, then summary reads none.
    const clock = scriptedClock([0, 2000, 5000])
    const m = new ScenarioMetrics(meta, clock)
    m.start()
    m.recordSuccess(10, 20, 100n)
    m.recordSuccess(30, 40, 100n)
    m.markSubmitted()
    m.markSettled(200n)

    const summary = m.summary(true)
    expect(summary.succeeded).toBe(2)
    expect(summary.concluded).toBe(true)
    expect(summary.settledValue).toBe('200')
    expect(summary.submitMs).toBe(2000)
    expect(summary.settleMs).toBe(5000)
    // 2 creates over 2000ms = 1/s
    expect(summary.createsPerSecond).toBe(1)
    // 200 units over 5000ms = 40/s
    expect(summary.settledPerSecond).toBe(40)
    expect(summary.quoteLatencyMs).toEqual({
      count: 2,
      p50: 10,
      p95: 30,
      max: 30
    })
    expect(summary.createLatencyMs).toEqual({
      count: 2,
      p50: 20,
      p95: 40,
      max: 40
    })
  })

  it('records failures by reason', () => {
    const m = new ScenarioMetrics(meta, scriptedClock([0, 100, 100]))
    m.start()
    m.recordFailure('grant_locked')
    m.recordFailure('grant_locked')
    m.recordFailure('token_expired')
    m.markSubmitted()
    const summary = m.summary(false)
    expect(summary.failures).toEqual({ grant_locked: 2, token_expired: 1 })
    expect(summary.concluded).toBe(false)
  })

  it('falls back to submit time for settle when settlement never marked', () => {
    const m = new ScenarioMetrics(meta, scriptedClock([0, 3000]))
    m.start()
    m.markSubmitted()
    const summary = m.summary(false)
    expect(summary.settleMs).toBe(3000)
  })

  it('reports zero rates when no time elapsed', () => {
    const m = new ScenarioMetrics(meta, scriptedClock([1000, 1000, 1000]))
    m.start()
    m.recordSuccess(5, 5, 10n)
    m.markSubmitted()
    m.markSettled(10n)
    const summary = m.summary(true)
    expect(summary.createsPerSecond).toBe(0)
    expect(summary.settledPerSecond).toBe(0)
  })

  it('accumulates delivered value from successes and the final mark', () => {
    const m = new ScenarioMetrics(meta, scriptedClock([0, 10, 20]))
    m.start()
    m.recordSuccess(1, 1, 100n)
    m.markSubmitted()
    // markSettled overrides the running total with the authoritative value.
    m.markSettled(100n)
    expect(m.summary(true).settledValue).toBe('100')
  })
})
