import type { BenchmarkResult, ScenarioSummary } from '@/types'

function formatFailures(failures: Record<string, number>): string {
  const entries = Object.entries(failures)
  if (entries.length === 0) {
    return 'none'
  }
  return entries.map(([reason, count]) => `${reason}=${count}`).join(', ')
}

/** Render a minor-unit integer string as a grouped major-unit amount. */
function formatMinor(value: string, scale: number): string {
  const negative = value.startsWith('-')
  const digits = (negative ? value.slice(1) : value).padStart(scale + 1, '0')
  const whole = digits.slice(0, digits.length - scale)
  const frac = scale > 0 ? `.${digits.slice(digits.length - scale)}` : ''
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${negative ? '-' : ''}${grouped}${frac}`
}

/** Throughput in slices per second over a window, to two decimals. */
function slicesPerSecond(slices: number, ms: number): string {
  if (ms <= 0) {
    return '0.00'
  }
  return ((slices / ms) * 1000).toFixed(2)
}

function latency(l: ScenarioSummary['quoteLatencyMs']): string {
  return `p50 ${l.p50}ms · p95 ${l.p95}ms · max ${l.max}ms`
}

/** Format a single scenario summary as a human-readable block. */
export function formatScenario(s: ScenarioSummary): string {
  const settleSeconds = (s.settleMs / 1000).toFixed(2)
  const submitSeconds = (s.submitMs / 1000).toFixed(2)
  const settled = `${formatMinor(s.settledValue, s.assetScale)} ${s.assetCode}`
  const lines = [
    `▶ ${s.label}`,
    `  concluded:        ${s.concluded ? 'yes' : 'NO'}`,
    `  slices:           ${s.succeeded}/${s.targetSlices} succeeded`,
    `  settled value:    ${settled}`,
    `  time to submit:   ${submitSeconds}s  (all slices created)`,
    `  time to conclude: ${settleSeconds}s  (fully settled)`,
    `  create rate:      ${s.createsPerSecond.toFixed(2)} slices/s  (submission)`,
    `  settle rate:      ${slicesPerSecond(s.succeeded, s.settleMs)} slices/s  (end-to-end delivery)`,
    `  quote latency:    ${latency(s.quoteLatencyMs)}`,
    `  create latency:   ${latency(s.createLatencyMs)}`
  ]
  if (s.settleLatencyMs) {
    lines.push(
      `  settle latency:   ${latency(s.settleLatencyMs)}  (submit→settled, n=${s.settleLatencyMs.count})`
    )
  }
  lines.push(`  failures:         ${formatFailures(s.failures)}`)
  return lines.join('\n')
}

/** Format the whole benchmark result for the console. */
export function formatResult(result: BenchmarkResult): string {
  const header = `Open Payments benchmark — ${result.scenarios.length} scenario(s)\nstarted ${result.startedAt}, finished ${result.finishedAt}`
  const body = result.scenarios.map(formatScenario).join('\n\n')
  return `${header}\n\n${body}`
}
