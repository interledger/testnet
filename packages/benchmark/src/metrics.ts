import type { Clock } from '@/util'
import { max, percentile } from '@/util'
import type { FailureReason, LatencySummary, ScenarioSummary } from '@/types'

/**
 * Collects timing and outcome samples for a single scenario and produces a
 * serialisable {@link ScenarioSummary}. The clock is injectable so tests can
 * assert exact durations.
 */
export class ScenarioMetrics {
  private startedAt = 0
  private submittedAt = 0
  private settledAt = 0
  private readonly quoteLatencies: number[] = []
  private readonly createLatencies: number[] = []
  private readonly settleLatencies: number[] = []
  private succeeded = 0
  private readonly failures: Record<string, number> = {}
  private settledValue = 0n

  constructor(
    private readonly meta: {
      label: string
      fromWalletAddress: string
      toWalletAddress: string
      targetSlices: number
      assetCode: string
      assetScale: number
    },
    private readonly now: Clock = Date.now
  ) {}

  /** Mark the start of the timed region (first slice about to be issued). */
  start(): void {
    this.startedAt = this.now()
  }

  /** Mark the point where all slices have been submitted (created). */
  markSubmitted(): void {
    this.submittedAt = this.now()
  }

  /** Mark full settlement of the incoming payment (the headline moment). */
  markSettled(value: bigint): void {
    this.settledAt = this.now()
    this.settledValue = value
  }

  recordSuccess(quoteMs: number, createMs: number, delivered: bigint): void {
    this.quoteLatencies.push(quoteMs)
    this.createLatencies.push(createMs)
    this.succeeded += 1
    this.settledValue += delivered
  }

  recordFailure(reason: FailureReason): void {
    this.failures[reason] = (this.failures[reason] ?? 0) + 1
  }

  /** Record one payment's end-to-end submit→settle latency (ms). */
  recordSettleLatency(ms: number): void {
    this.settleLatencies.push(ms)
  }

  private latencySummary(values: number[]): LatencySummary {
    return {
      count: values.length,
      p50: percentile(values, 50),
      p95: percentile(values, 95),
      max: max(values)
    }
  }

  private perSecond(count: number, ms: number): number {
    if (ms <= 0) {
      return 0
    }
    return Number(((count / ms) * 1000).toFixed(2))
  }

  summary(concluded: boolean): ScenarioSummary {
    const submitMs = Math.max(0, this.submittedAt - this.startedAt)
    const settleMs = Math.max(
      0,
      (this.settledAt || this.submittedAt) - this.startedAt
    )
    return {
      label: this.meta.label,
      fromWalletAddress: this.meta.fromWalletAddress,
      toWalletAddress: this.meta.toWalletAddress,
      targetSlices: this.meta.targetSlices,
      assetCode: this.meta.assetCode,
      assetScale: this.meta.assetScale,
      succeeded: this.succeeded,
      failures: { ...this.failures },
      concluded,
      settledValue: this.settledValue.toString(),
      submitMs,
      settleMs,
      createsPerSecond: this.perSecond(this.succeeded, submitMs),
      settledPerSecond: this.perSecond(Number(this.settledValue), settleMs),
      quoteLatencyMs: this.latencySummary(this.quoteLatencies),
      createLatencyMs: this.latencySummary(this.createLatencies),
      settleLatencyMs: this.settleLatencies.length
        ? this.latencySummary(this.settleLatencies)
        : undefined
    }
  }
}
