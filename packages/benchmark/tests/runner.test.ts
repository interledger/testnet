import { OpenPaymentsClientError } from '@interledger/open-payments'
import { runScenario, runBenchmark, type GrantResolver } from '@/runner'
import type { BenchmarkClient } from '@/open-payments'
import type { PaymentSample, PaymentScenarioConfig } from '@/types'

const immediateSleep = jest.fn().mockResolvedValue(undefined)
const grant: GrantResolver = async () => ({
  accessToken: 'otok',
  manageUrl: 'https://manage'
})

interface FakeOpts {
  paymentSize: number
  assetByUrl?: Record<string, { code: string; scale: number }>
  outgoingCreate?: jest.Mock
  quoteCreate?: jest.Mock
  getReceived?: (deliveredCount: number) => string
  rotateToken?: jest.Mock
  nonInteractiveToken?: jest.Mock
}

function tokenExpired(): OpenPaymentsClientError {
  return new OpenPaymentsClientError('expired', {
    description: 'token expired',
    status: 401
  })
}

function makeFake(opts: FakeOpts): {
  client: BenchmarkClient
  mocks: Record<string, jest.Mock>
  state: { delivered: number }
} {
  const state = { delivered: 0 }
  const assetFor = (url: string) =>
    opts.assetByUrl?.[url] ?? { code: 'EUR', scale: 2 }

  const getWalletAddress = jest.fn(async (url: string) => ({
    id: url,
    authServer: `${url}/auth`,
    resourceServer: `${url}/rs`,
    assetCode: assetFor(url).code,
    assetScale: assetFor(url).scale
  })) as unknown as jest.Mock

  const outgoingCreate =
    opts.outgoingCreate ??
    jest.fn(async () => {
      state.delivered += 1
      return { id: `https://op/${state.delivered}` }
    })

  const getReceived =
    opts.getReceived ?? ((count: number) => String(count * opts.paymentSize))

  const mocks = {
    getWalletAddress,
    nonInteractiveToken:
      opts.nonInteractiveToken ??
      jest.fn(async (_a: string, type: string) => `${type}-tok`),
    createIncomingPayment: jest.fn(async () => ({ id: 'https://ip/1' })),
    getIncomingPayment: jest.fn(async () => ({
      receivedAmount: { value: getReceived(state.delivered) }
    })),
    createQuote:
      opts.quoteCreate ??
      jest.fn(async () => ({
        id: 'q',
        debitAmount: {
          value: String(opts.paymentSize),
          assetCode: 'EUR',
          assetScale: 2
        }
      })),
    createOutgoingPayment: outgoingCreate,
    // A created payment always reports as fully sent when polled.
    getOutgoingPayment: jest.fn(async () => ({
      failed: false,
      sentAmount: { value: String(opts.paymentSize) },
      debitAmount: { value: String(opts.paymentSize) }
    })),
    rotateToken:
      opts.rotateToken ??
      jest.fn(async () => ({
        accessToken: 'otok2',
        manageUrl: 'https://manage2'
      }))
  }

  const client = {
    getWalletAddress: mocks.getWalletAddress,
    nonInteractiveToken: mocks.nonInteractiveToken,
    createIncomingPayment: mocks.createIncomingPayment,
    getIncomingPayment: mocks.getIncomingPayment,
    createQuote: mocks.createQuote,
    createOutgoingPayment: mocks.createOutgoingPayment,
    getOutgoingPayment: mocks.getOutgoingPayment,
    rotateToken: mocks.rotateToken
  } as unknown as BenchmarkClient

  return { client, mocks, state }
}

const scenario = (
  over: Partial<PaymentScenarioConfig> = {}
): PaymentScenarioConfig => ({
  amount: 1000,
  amountScale: 2,
  paymentSize: 100,
  fromWalletAddress: 'https://wallet/alice',
  toWalletAddress: 'https://wallet/bob',
  workers: 3,
  ...over
})

describe('runScenario', () => {
  it('completes a clean run and reports metrics', async () => {
    const { client, mocks } = makeFake({ paymentSize: 100 })
    const summary = await runScenario(scenario(), {
      client,
      resolveGrant: grant,
      sleep: immediateSleep,
      now: () => 0
    })

    expect(summary.succeeded).toBe(10)
    expect(summary.targetSlices).toBe(10)
    expect(summary.concluded).toBe(true)
    expect(summary.settledValue).toBe('1000')
    expect(summary.failures).toEqual({})
    expect(mocks.createOutgoingPayment).toHaveBeenCalledTimes(10)
    // Each payment is created debit-fixed, spending exactly the debit the quote
    // returned — never delivery-fixed via a quoteId.
    expect(mocks.createOutgoingPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        incomingPayment: 'https://ip/1',
        debitAmount: { value: '100', assetCode: 'EUR', assetScale: 2 }
      })
    )
    expect(mocks.createOutgoingPayment).not.toHaveBeenCalledWith(
      expect.objectContaining({ quoteId: expect.anything() })
    )
  })

  it('rotates the token on expiry and still concludes', async () => {
    const outgoingCreate = jest
      .fn()
      .mockRejectedValueOnce(tokenExpired())
      .mockImplementation(async () => {})
    const { client, mocks } = makeFake({
      paymentSize: 100,
      outgoingCreate,
      // received tracks successful creates (all but the first rejection)
      getReceived: () => String((outgoingCreate.mock.calls.length - 1) * 100)
    })

    const summary = await runScenario(scenario({ amount: 200, workers: 1 }), {
      client,
      resolveGrant: grant,
      sleep: immediateSleep,
      now: () => 0
    })

    expect(mocks.rotateToken).toHaveBeenCalled()
    expect(summary.concluded).toBe(true)
    expect(summary.succeeded).toBe(2)
  })

  it('refreshes the quote token on expiry', async () => {
    const quoteCreate = jest
      .fn()
      .mockRejectedValueOnce(tokenExpired())
      .mockResolvedValue({ id: 'q' })
    const nonInteractiveToken = jest.fn(
      async (_a: string, type: string) => `${type}-tok`
    )
    const { client } = makeFake({
      paymentSize: 100,
      quoteCreate,
      nonInteractiveToken
    })

    const summary = await runScenario(scenario({ amount: 100, workers: 1 }), {
      client,
      resolveGrant: grant,
      sleep: immediateSleep,
      now: () => 0
    })

    // quote token requested at setup + refreshed after the expiry
    const quoteRequests = nonInteractiveToken.mock.calls.filter(
      (c) => c[1] === 'quote'
    )
    expect(quoteRequests.length).toBeGreaterThanOrEqual(2)
    expect(summary.concluded).toBe(true)
  })

  it('stops when the incoming payment is already full', async () => {
    const outgoingCreate = jest.fn().mockRejectedValue(
      new OpenPaymentsClientError('full', {
        description: 'receive amount exceeds the remaining amount'
      })
    )
    const { client } = makeFake({
      paymentSize: 100,
      outgoingCreate,
      getReceived: () => '1000' // already fully settled
    })

    const summary = await runScenario(scenario({ workers: 1 }), {
      client,
      resolveGrant: grant,
      sleep: immediateSleep,
      now: () => 0
    })

    expect(summary.failures.already_full).toBeGreaterThanOrEqual(1)
    expect(summary.concluded).toBe(true)
  })

  it('aborts after the consecutive-failure budget is exceeded', async () => {
    const outgoingCreate = jest.fn().mockRejectedValue(new Error('boom'))
    const { client } = makeFake({ paymentSize: 100, outgoingCreate })

    await expect(
      runScenario(scenario({ workers: 1 }), {
        client,
        resolveGrant: grant,
        sleep: immediateSleep,
        now: () => 0,
        maxConsecutiveFailures: 3
      })
    ).rejects.toThrow(/consecutive failures/)
    expect(outgoingCreate).toHaveBeenCalledTimes(3)
  })

  it('reports not concluded when settlement never reaches the target', async () => {
    const { client } = makeFake({
      paymentSize: 100,
      getReceived: () => '0'
    })

    const summary = await runScenario(scenario({ amount: 100, workers: 1 }), {
      client,
      resolveGrant: grant,
      sleep: immediateSleep,
      now: () => 1000,
      settleTimeoutMs: 0
    })

    expect(summary.concluded).toBe(false)
  })

  it('supports a cross-currency payer/receiver', async () => {
    const { client, mocks } = makeFake({
      paymentSize: 100,
      assetByUrl: { 'https://wallet/bob': { code: 'USD', scale: 2 } }
    })
    const summary = await runScenario(scenario(), {
      client,
      resolveGrant: grant,
      sleep: immediateSleep,
      now: () => 0
    })

    expect(summary.concluded).toBe(true)
    expect(summary.succeeded).toBe(10)
    // The slice delivers a fixed amount in the receiver's asset (USD).
    expect(mocks.createQuote).toHaveBeenCalledWith(
      expect.objectContaining({
        receiveAmount: expect.objectContaining({ assetCode: 'USD' })
      })
    )
  })

  it('skip-quote probes exactly once for a same-asset pair, then reuses the debit', async () => {
    const { client, mocks } = makeFake({ paymentSize: 100 })
    const summary = await runScenario(scenario(), {
      client,
      resolveGrant: grant,
      sleep: immediateSleep,
      now: () => 0,
      skipQuote: true
    })

    expect(summary.succeeded).toBe(10)
    expect(summary.concluded).toBe(true)
    // Even same-asset skip-quote probes once up front (the debit only equals the
    // delivered amount when the ASE charges no fee) — one quote, not per slice.
    expect(mocks.createQuote).toHaveBeenCalledTimes(1)
    expect(mocks.createOutgoingPayment).toHaveBeenCalledTimes(10)
    // Every create reuses the probe's debit and never delivery-fixes via a quote.
    expect(mocks.createOutgoingPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        incomingPayment: 'https://ip/1',
        debitAmount: { value: '100', assetCode: 'EUR', assetScale: 2 }
      })
    )
    expect(mocks.createOutgoingPayment).not.toHaveBeenCalledWith(
      expect.objectContaining({ quoteId: expect.anything() })
    )
  })

  it('skip-quote uses exactly one upfront probe quote for a cross-currency pair', async () => {
    const quoteCreate = jest.fn(async () => ({
      id: 'q',
      debitAmount: { value: '90', assetCode: 'EUR', assetScale: 2 }
    }))
    const { client, mocks } = makeFake({
      paymentSize: 100,
      quoteCreate,
      assetByUrl: { 'https://wallet/bob': { code: 'USD', scale: 2 } }
    })
    const summary = await runScenario(scenario(), {
      client,
      resolveGrant: grant,
      sleep: immediateSleep,
      now: () => 0,
      skipQuote: true
    })

    expect(summary.concluded).toBe(true)
    // Exactly one quote: the upfront FX probe, not one per slice.
    expect(mocks.createQuote).toHaveBeenCalledTimes(1)
    expect(mocks.createOutgoingPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        incomingPayment: 'https://ip/1',
        debitAmount: { value: '90', assetCode: 'EUR', assetScale: 2 }
      })
    )
  })

  it('measures per-payment settle latency when enabled', async () => {
    const { client, mocks } = makeFake({ paymentSize: 100 })
    const summary = await runScenario(scenario({ amount: 300, workers: 1 }), {
      client,
      resolveGrant: grant,
      sleep: immediateSleep,
      now: () => 0,
      settleLatency: true
    })

    expect(mocks.getOutgoingPayment).toHaveBeenCalled()
    expect(summary.settleLatencyMs).toBeDefined()
    expect(summary.settleLatencyMs?.count).toBe(3)
  })

  it('records settle latency for every payment (round-robin watcher)', async () => {
    const { client, mocks } = makeFake({ paymentSize: 100 })
    const samples: PaymentSample[] = []
    const summary = await runScenario(scenario({ amount: 500, workers: 2 }), {
      client,
      resolveGrant: grant,
      sleep: immediateSleep,
      now: () => 0,
      settleLatency: true,
      onSamples: (batch) => samples.push(...batch)
    })

    expect(mocks.getOutgoingPayment).toHaveBeenCalled()
    // Every one of the 5 created payments is observed and timed, not just a
    // subset — the watcher polls the whole in-flight set each tick.
    expect(summary.settleLatencyMs?.count).toBe(5)
    const successes = samples.filter((s) => s.outcome === 'success')
    expect(successes).toHaveLength(5)
    expect(successes.every((s) => s.settleMs !== undefined)).toBe(true)
  })

  it('omits settle latency when not enabled', async () => {
    const { client, mocks } = makeFake({ paymentSize: 100 })
    const summary = await runScenario(scenario({ amount: 100, workers: 1 }), {
      client,
      resolveGrant: grant,
      sleep: immediateSleep,
      now: () => 0
    })

    expect(mocks.getOutgoingPayment).not.toHaveBeenCalled()
    expect(summary.settleLatencyMs).toBeUndefined()
  })

  it('emits one per-attempt sample per successful slice via onSamples', async () => {
    const { client } = makeFake({ paymentSize: 100 })
    const samples: PaymentSample[] = []
    const summary = await runScenario(scenario({ amount: 300, workers: 1 }), {
      client,
      resolveGrant: grant,
      sleep: immediateSleep,
      now: () => 0,
      scenarioIndex: 2,
      onSamples: (batch) => samples.push(...batch)
    })

    expect(summary.succeeded).toBe(3)
    expect(samples).toHaveLength(3)
    for (const s of samples) {
      expect(s.scenario).toBe(2)
      expect(s.outcome).toBe('success')
      expect(s.worker).toBe(0)
      expect(s.failedState).toBeUndefined()
      expect(s.errorReason).toBeUndefined()
    }
    // Attempts are numbered monotonically.
    expect(samples.map((s) => s.attempt).sort((a, b) => a - b)).toEqual([
      1, 2, 3
    ])
  })

  it('records a failure sample with the failed state and error detail', async () => {
    const outgoingCreate = jest.fn().mockRejectedValue(
      new OpenPaymentsClientError('boom', {
        description: 'Request timed out',
        status: 504
      })
    )
    const { client } = makeFake({ paymentSize: 100, outgoingCreate })
    const samples: PaymentSample[] = []

    await expect(
      runScenario(scenario({ workers: 1 }), {
        client,
        resolveGrant: grant,
        sleep: immediateSleep,
        now: () => 0,
        maxConsecutiveFailures: 2,
        onSamples: (batch) => samples.push(...batch)
      })
    ).rejects.toThrow(/consecutive failures/)

    // Samples are flushed even on the abort path.
    expect(samples.length).toBeGreaterThanOrEqual(2)
    const failed = samples[0]
    expect(failed.outcome).toBe('failure')
    expect(failed.failedState).toBe('create')
    expect(failed.errorReason).toBe('other')
    expect(failed.errorDetail).toContain('Request timed out')
    expect(failed.errorDetail).toContain('status=504')
  })

  it('rejects an asset-scale mismatch with the receiver', async () => {
    const { client } = makeFake({ paymentSize: 100 })
    await expect(
      runScenario(scenario({ amountScale: 3 }), {
        client,
        resolveGrant: grant,
        sleep: immediateSleep
      })
    ).rejects.toThrow(/must match/)
  })
})

describe('runBenchmark', () => {
  it('runs a single scenario', async () => {
    const { client } = makeFake({ paymentSize: 100 })
    const result = await runBenchmark(
      { client: {} as never, payments: [scenario()] },
      { client, resolveGrant: grant, sleep: immediateSleep, now: () => 0 }
    )
    expect(result.scenarios).toHaveLength(1)
    expect(result.startedAt).toBeDefined()
    expect(result.finishedAt).toBeDefined()
  })

  it('runs scenarios sequentially when configured', async () => {
    const { client } = makeFake({ paymentSize: 100 })
    const result = await runBenchmark(
      {
        client: {} as never,
        sequential: true,
        payments: [
          scenario(),
          scenario({
            fromWalletAddress: 'https://wallet/carol',
            toWalletAddress: 'https://wallet/dave'
          })
        ]
      },
      { client, resolveGrant: grant, sleep: immediateSleep, now: () => 0 }
    )
    expect(result.scenarios).toHaveLength(2)
    expect(result.scenarios.every((s) => s.concluded)).toBe(true)
  })
})
