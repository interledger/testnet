import type { WalletAddress } from '@interledger/open-payments'
import type {
  Amount,
  BenchmarkConfig,
  BenchmarkResult,
  PaymentOutcome,
  PaymentSample,
  PaymentState,
  PaymentScenarioConfig,
  ScenarioSummary
} from '@/types'
import type { BenchmarkClient } from '@/open-payments'
import { ScenarioMetrics } from '@/metrics'
import { Dispenser } from '@/dispenser'
import { runPool } from '@/pool'
import { RotatingToken } from '@/rotating-token'
import { classifyError, describeError } from '@/errors'
import { sleep as realSleep, type Clock, type Sleep } from '@/util'

/** Resolves an approved outgoing-payment grant token for a payer. */
export type GrantResolver = (
  payer: WalletAddress,
  debitAmount: Amount
) => Promise<{ accessToken: string; manageUrl?: string }>

export interface RunScenarioDeps {
  client: BenchmarkClient
  resolveGrant: GrantResolver
  now?: Clock
  sleep?: Sleep
  log?: (message: string) => void
  /**
   * 1-based index of this scenario within the run; stamped onto every
   * {@link PaymentSample} so a combined CSV can distinguish scenarios. Defaults
   * to 1. {@link runBenchmark} sets it per scenario.
   */
  scenarioIndex?: number
  /**
   * Receives every per-attempt {@link PaymentSample} for the scenario, flushed
   * once as a batch when the scenario ends — after the settlement watchers have
   * attached any async `settleMs`, so each sample is complete.
   */
  onSamples?: (samples: PaymentSample[]) => void
  /** Log per-slice request timing (quote + create latency) as slices complete. */
  verbose?: boolean
  /**
   * Skip the per-slice quote: create each outgoing payment directly from the
   * incoming payment with a fixed `debitAmount` instead of quoting first. The
   * per-slice debit is resolved once at scenario start (identity for a
   * same-asset pair; a single upfront quote establishes the FX rate for a
   * cross-currency pair), so workers never call `createQuote`.
   */
  skipQuote?: boolean
  /** Abort a scenario after this many consecutive non-recoverable failures. */
  maxConsecutiveFailures?: number
  /** How long a worker waits when no reservation is currently claimable. */
  idlePollMs?: number
  /** Interval between settlement polls of the incoming payment. */
  settlePollMs?: number
  /** Give up waiting for full settlement after this long. */
  settleTimeoutMs?: number
  /** Incoming payment lifetime; must exceed the run duration. */
  incomingExpiryMs?: number
  /**
   * Measure per-payment submit→settle latency by polling each created outgoing
   * payment to full settlement, concurrently with submission.
   */
  settleLatency?: boolean
  /**
   * Max concurrent outgoing-payment polls per settlement tick (defaults to the
   * scenario's worker count). Raise it to observe a large settlement backlog
   * faster, at the cost of more read load on the ASE.
   */
  settleWatchers?: number
  /** Interval between polls of an individual outgoing payment awaiting settlement. */
  settleWatchPollMs?: number
}

interface Control {
  abort: boolean
  abortError?: Error
  complete: boolean
  consecutiveFailures: number
}

const DEFAULTS = {
  maxConsecutiveFailures: 10,
  idlePollMs: 25,
  settlePollMs: 1000,
  settleTimeoutMs: 120_000,
  // Keep the incoming payment fillable as long as the protocol allows. Rafiki
  // caps expiry at INCOMING_PAYMENT_EXPIRY_MAX_MS (30 days) and rejects anything
  // beyond `now + max`, so we sit one hour under it to absorb client/server
  // clock skew.
  incomingExpiryMs: 30 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000,
  settleWatchPollMs: 250
}

/** Run a single benchmark scenario and return its measured summary. */
export async function runScenario(
  scenario: PaymentScenarioConfig,
  deps: RunScenarioDeps
): Promise<ScenarioSummary> {
  const now = deps.now ?? Date.now
  const sleep = deps.sleep ?? realSleep
  const log = deps.log ?? (() => {})
  const cfg = { ...DEFAULTS, ...stripUndefined(deps) }

  const [payer, receiver] = await Promise.all([
    deps.client.getWalletAddress(scenario.fromWalletAddress),
    deps.client.getWalletAddress(scenario.toWalletAddress)
  ])

  assertReceiverScale(scenario, receiver)

  // `amount` and `paymentSize` are denominated in the receiver's asset (we fill
  // a fixed incoming payment on the receiver). For a cross-currency pair the
  // payer's asset differs and the per-slice debit is set by the quote's FX.
  const assetCode = receiver.assetCode
  const assetScale = scenario.amountScale
  const target = scenario.amount / scenario.paymentSize
  const label = `${scenario.fromWalletAddress} → ${scenario.toWalletAddress}`
  if (payer.assetCode !== receiver.assetCode) {
    log(
      `[${label}] cross-currency: debiting ${payer.assetCode} to deliver ${receiver.assetCode}`
    )
  }

  // Non-interactive tokens (cheap to re-request, so no manage/rotation needed).
  let incomingToken = await deps.client.nonInteractiveToken(
    receiver.authServer,
    'incoming-payment',
    ['create', 'read', 'list']
  )
  let quoteToken = await deps.client.nonInteractiveToken(
    payer.authServer,
    'quote',
    ['create', 'read']
  )
  const refreshIncomingToken = async () => {
    incomingToken = await deps.client.nonInteractiveToken(
      receiver.authServer,
      'incoming-payment',
      ['create', 'read', 'list']
    )
  }
  const refreshQuoteToken = async () => {
    quoteToken = await deps.client.nonInteractiveToken(
      payer.authServer,
      'quote',
      ['create', 'read']
    )
  }

  const incomingPayment = await deps.client.createIncomingPayment({
    receiver,
    incomingAmount: { value: String(scenario.amount), assetCode, assetScale },
    accessToken: incomingToken,
    expiresAt: new Date(now() + cfg.incomingExpiryMs).toISOString(),
    description: 'benchmark incoming payment'
  })

  const grant = await deps.resolveGrant(payer, {
    value: String(scenario.amount),
    assetCode: payer.assetCode,
    assetScale
  })
  const outgoingToken = new RotatingToken(
    { value: grant.accessToken, manageUrl: grant.manageUrl },
    async (manageUrl, value) => {
      const rotated = await deps.client.rotateToken(manageUrl, value)
      return { value: rotated.accessToken, manageUrl: rotated.manageUrl }
    }
  )

  // The quote prices delivering `paymentSize` in the receiver's asset; its
  // returned `debitAmount` (identity for same-asset, an FX/fee conversion across
  // assets, or a spread on this ASE) is what we then spend per slice. We pay
  // that debit directly rather than the quote, so a path spread never turns into
  // a delivery-target the payment can fail to hit.
  const receiveAmount: Amount = {
    value: String(scenario.paymentSize),
    assetCode,
    assetScale
  }

  // When quoting is skipped, resolve the fixed per-slice debit ONCE by quoting a
  // single slice up front, then reuse it for every create so no worker quotes.
  // We must probe even for a same-asset pair: debit only equals the delivered
  // `paymentSize` when the ASE charges no sending fee/spread — otherwise a
  // debit == paymentSize create delivers less than paymentSize, and when the fee
  // meets or exceeds it the create is rejected with "negative receive amount".
  const skipQuote = cfg.skipQuote ?? false
  let directDebit: Amount | undefined
  if (skipQuote) {
    const probe = await deps.client.createQuote({
      payer,
      receiver: incomingPayment.id,
      receiveAmount,
      accessToken: quoteToken
    })
    directDebit = probe.debitAmount
    const sameAsset = payer.assetCode === receiver.assetCode
    log(
      `[${label}] skip-quote: fixed per-slice debit ${directDebit.value} ${directDebit.assetCode} (asset scale ${directDebit.assetScale}) from an upfront ${sameAsset ? 'fee' : 'FX'} probe.`
    )
  }

  const dispenser = new Dispenser(target)
  const metrics = new ScenarioMetrics(
    {
      label,
      fromWalletAddress: scenario.fromWalletAddress,
      toWalletAddress: scenario.toWalletAddress,
      targetSlices: target,
      assetCode,
      assetScale
    },
    now
  )
  const control: Control = {
    abort: false,
    complete: false,
    consecutiveFailures: 0
  }

  const registerFailure = (err: Error): void => {
    control.consecutiveFailures += 1
    if (control.consecutiveFailures >= cfg.maxConsecutiveFailures) {
      control.abort = true
      control.abortError = new Error(
        `Aborting scenario after ${control.consecutiveFailures} consecutive failures: ${describeError(err)}`
      )
    }
  }

  metrics.start()
  // Base instant for each sample's `offsetMs`; aligned with the metrics clock.
  const scenarioStart = now()
  const scenarioIndex = deps.scenarioIndex ?? 1
  log(
    `[${label}] submitting ${target} slice(s) with ${scenario.workers} worker(s)`
  )

  // Per-attempt lifecycle samples for the CSV, buffered and flushed once at the
  // end so async settlement timings can be attached before they are emitted.
  const samples: PaymentSample[] = []
  const recordSample = (fields: {
    attempt: number
    worker: number
    startedAt: number
    quoteMs: number
    createMs: number
    outcome: PaymentOutcome
    failedState?: PaymentState
    err?: unknown
  }): PaymentSample => {
    const sample: PaymentSample = {
      scenario: scenarioIndex,
      attempt: fields.attempt,
      worker: fields.worker,
      offsetMs: Math.max(0, fields.startedAt - scenarioStart),
      quoteMs: fields.quoteMs,
      createMs: fields.createMs,
      totalMs: fields.quoteMs + fields.createMs,
      outcome: fields.outcome,
      failedState: fields.failedState,
      errorReason:
        fields.err !== undefined ? classifyError(fields.err) : undefined,
      errorDetail:
        fields.err !== undefined ? describeError(fields.err) : undefined
    }
    samples.push(sample)
    return sample
  }

  // Monotonically-increasing slice number for per-request verbose logging. JS is
  // single-threaded between awaits, so this needs no synchronisation.
  let sliceNo = 0
  const verbose = cfg.verbose ?? false

  // Outgoing payments settle asynchronously after they are created. When
  // enabled, a separate watcher pool polls each created payment to full
  // settlement to measure end-to-end submit→settle latency, running alongside
  // the submit workers so it doesn't distort create throughput.
  const settleLatencyEnabled = cfg.settleLatency ?? false
  const settleQueue: Array<{
    url: string
    submitTs: number
    sample: PaymentSample
  }> = []
  let submitDone = false

  // Round-robin settlement watcher: every `settleWatchPollMs` it polls each
  // in-flight payment exactly once (with bounded concurrency), rather than tying
  // up a worker per payment until it settles. This bounds the observation lag to
  // ~one poll interval regardless of how deep the backlog gets, so `settleMs`
  // measures real submit→settle time instead of time a payment spent waiting in
  // a queue for a free watcher (which made the old measurement climb under load).
  const watchSettlements = async (): Promise<void> => {
    const pollConcurrency = deps.settleWatchers ?? scenario.workers
    // Payments created but not yet observed settled / failed / timed out.
    const inFlight: Array<{
      url: string
      submitTs: number
      sample: PaymentSample
    }> = []

    while (!control.abort) {
      // Absorb everything created since the last tick.
      for (let next = settleQueue.shift(); next; next = settleQueue.shift()) {
        inFlight.push(next)
      }
      if (inFlight.length === 0) {
        if (submitDone) {
          return
        }
        await sleep(cfg.settleWatchPollMs)
        continue
      }

      // Poll a stable snapshot of the in-flight set once this tick. `retire`
      // collects indices to drop (fully sent, failed, timed out, or a hard
      // error); a `token_expired` leaves the item in-flight to retry next tick.
      const retire = new Set<number>()
      let cursor = 0
      const pollWorker = async (): Promise<void> => {
        while (!control.abort) {
          const i = cursor++
          if (i >= inFlight.length) {
            return
          }
          const item = inFlight[i]
          try {
            const op = await deps.client.getOutgoingPayment(
              item.url,
              outgoingToken.current()
            )
            if (op.failed) {
              retire.add(i)
            } else if (
              BigInt(op.sentAmount.value) >= BigInt(op.debitAmount.value)
            ) {
              const settledMs = now() - item.submitTs
              metrics.recordSettleLatency(settledMs)
              item.sample.settleMs = settledMs
              retire.add(i)
            } else if (now() >= item.submitTs + cfg.settleTimeoutMs) {
              retire.add(i) // never settled within the timeout; drop, no sample
            }
          } catch (err) {
            if (classifyError(err) === 'token_expired') {
              await outgoingToken.rotate(outgoingToken.current()).catch(() => {})
            } else {
              retire.add(i) // give up this one sample; keep watching the rest
            }
          }
        }
      }
      await Promise.all(
        Array.from({ length: Math.min(pollConcurrency, inFlight.length) }, () =>
          pollWorker()
        )
      )

      if (retire.size > 0) {
        const remaining = inFlight.filter((_, i) => !retire.has(i))
        inFlight.length = 0
        inFlight.push(...remaining)
      }
      // Done only once nothing is in flight and no more will be created.
      if (inFlight.length === 0 && submitDone && settleQueue.length === 0) {
        return
      }
      await sleep(cfg.settleWatchPollMs)
    }
  }
  const settleWatch = settleLatencyEnabled ? watchSettlements() : null

  await runPool(scenario.workers, async (workerId) => {
    while (!control.abort && !control.complete) {
      if (!dispenser.claim()) {
        if (dispenser.done) {
          return
        }
        await sleep(cfg.idlePollMs)
        continue
      }

      const slice = ++sliceNo
      const startedAt = now()
      // The debit we will actually spend on this slice: for skip-quote it was
      // resolved once up front; otherwise the quote tells us what delivering
      // `paymentSize` costs the payer, and we pay exactly that.
      let sliceDebit: Amount | undefined = directDebit
      if (!skipQuote) {
        try {
          const quote = await deps.client.createQuote({
            payer,
            receiver: incomingPayment.id,
            receiveAmount,
            accessToken: quoteToken
          })
          sliceDebit = quote.debitAmount
        } catch (err) {
          const reason = classifyError(err)
          const quoteMs = now() - startedAt
          dispenser.release()
          recordSample({
            attempt: slice,
            worker: workerId,
            startedAt,
            quoteMs,
            createMs: 0,
            outcome: 'failure',
            failedState: 'quote',
            err
          })
          if (verbose) {
            log(
              `[${label}] slice #${slice} quote FAILED (${reason}) in ${quoteMs}ms`
            )
          }
          if (reason === 'token_expired') {
            await refreshQuoteToken()
            continue
          }
          metrics.recordFailure(reason)
          registerFailure(err as Error)
          continue
        }
      }

      const quotedAt = now()
      const usedToken = outgoingToken.current()
      const quoteMs = quotedAt - startedAt
      try {
        // Pay the exact debit the quote returned (debit-fixed), created directly
        // from the incoming payment. A debit-fixed send just spends `sliceDebit`
        // and delivers whatever it buys — more robust than a delivery-fixed
        // create, which must hit an exact delivery target and can fail to send
        // when the path carries a spread/fee.
        const op = await deps.client.createOutgoingPayment({
          payer,
          accessToken: usedToken,
          incomingPayment: incomingPayment.id,
          debitAmount: sliceDebit!
        })
        const createMs = now() - quotedAt
        metrics.recordSuccess(quoteMs, createMs, BigInt(scenario.paymentSize))
        dispenser.confirm()
        control.consecutiveFailures = 0
        const sample = recordSample({
          attempt: slice,
          worker: workerId,
          startedAt,
          quoteMs,
          createMs,
          outcome: 'success'
        })
        if (settleLatencyEnabled) {
          settleQueue.push({ url: op.id, submitTs: now(), sample })
        }
        if (verbose) {
          log(
            `[${label}] slice #${slice} ok — quote ${quoteMs}ms, create ${createMs}ms, total ${quoteMs + createMs}ms`
          )
        }
      } catch (err) {
        const reason = classifyError(err)
        const createMs = now() - quotedAt
        recordSample({
          attempt: slice,
          worker: workerId,
          startedAt,
          quoteMs,
          createMs,
          outcome: 'failure',
          failedState: 'create',
          err
        })
        if (verbose) {
          log(
            `[${label}] slice #${slice} create FAILED (${reason}) — quote ${quoteMs}ms, create ${createMs}ms — ${describeError(err)}`
          )
        }
        if (reason === 'token_expired') {
          dispenser.release()
          await outgoingToken.rotate(usedToken).catch(() => {})
          continue
        }
        if (reason === 'already_full') {
          // The incoming payment is already satisfied by other slices; stop.
          dispenser.release()
          metrics.recordFailure('already_full')
          control.complete = true
          return
        }
        dispenser.release()
        metrics.recordFailure(reason)
        registerFailure(err as Error)
      }
    }
  })

  metrics.markSubmitted()

  if (control.abort && control.abortError) {
    submitDone = true
    if (settleWatch) {
      await settleWatch
    }
    deps.onSamples?.(samples)
    throw control.abortError
  }

  const settled = await pollSettlement({
    client: deps.client,
    url: incomingPayment.id,
    getToken: () => incomingToken,
    refreshToken: refreshIncomingToken,
    target: BigInt(scenario.amount),
    now,
    sleep,
    pollMs: cfg.settlePollMs,
    timeoutMs: cfg.settleTimeoutMs
  })

  // Submission and aggregate settlement are done; let the watchers drain any
  // still-settling payments, then finish.
  submitDone = true
  if (settleWatch) {
    await settleWatch
  }

  metrics.markSettled(settled.received)
  deps.onSamples?.(samples)
  log(
    `[${label}] ${settled.concluded ? 'concluded' : 'INCOMPLETE'} — received ${settled.received}/${scenario.amount}`
  )
  return metrics.summary(settled.concluded)
}

interface PollSettlementArgs {
  client: BenchmarkClient
  url: string
  getToken: () => string
  refreshToken: () => Promise<void>
  target: bigint
  now: Clock
  sleep: Sleep
  pollMs: number
  timeoutMs: number
}

/** Poll the incoming payment until it reaches `target` or the timeout elapses. */
async function pollSettlement(
  args: PollSettlementArgs
): Promise<{ concluded: boolean; received: bigint }> {
  const deadline = args.now() + args.timeoutMs
  let received = 0n
  while (args.now() < deadline) {
    try {
      const incoming = await args.client.getIncomingPayment(
        args.url,
        args.getToken()
      )
      received = BigInt(incoming.receivedAmount.value)
      if (received >= args.target) {
        return { concluded: true, received }
      }
    } catch (err) {
      if (classifyError(err) === 'token_expired') {
        await args.refreshToken()
      } else {
        throw err
      }
    }
    await args.sleep(args.pollMs)
  }
  return { concluded: received >= args.target, received }
}

/**
 * `amount` and `paymentSize` describe the incoming payment on the receiver, so
 * they are denominated in the receiver's asset — `amountScale` must therefore
 * match the receiver's asset scale. The payer may use a different asset and
 * scale; cross-currency slices are settled via the quote's FX conversion.
 */
function assertReceiverScale(
  scenario: PaymentScenarioConfig,
  receiver: WalletAddress
): void {
  if (scenario.amountScale !== receiver.assetScale) {
    throw new Error(
      `amountScale (${scenario.amountScale}) must match the receiver's asset scale (${receiver.assetScale}); amount and paymentSize are denominated in the receiver's asset (${receiver.assetCode}).`
    )
  }
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      out[key as keyof T] = value as T[keyof T]
    }
  }
  return out
}

/** Run all scenarios in a config and collect their summaries. */
export async function runBenchmark(
  config: BenchmarkConfig,
  deps: RunScenarioDeps
): Promise<BenchmarkResult> {
  const startedAt = new Date().toISOString()
  let scenarios: ScenarioSummary[]

  if (config.sequential) {
    scenarios = []
    for (const [i, scenario] of config.payments.entries()) {
      scenarios.push(
        await runScenario(scenario, { ...deps, scenarioIndex: i + 1 })
      )
    }
  } else {
    scenarios = await Promise.all(
      config.payments.map((scenario, i) =>
        runScenario(scenario, { ...deps, scenarioIndex: i + 1 })
      )
    )
  }

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    scenarios
  }
}
