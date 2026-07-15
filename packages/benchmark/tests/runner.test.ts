import { OpenPaymentsClientError } from '@interledger/open-payments'
import { runScenario, runBenchmark, type GrantResolver } from '@/runner'
import type { BenchmarkClient } from '@/open-payments'
import type { PaymentScenarioConfig } from '@/types'

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
    createQuote: opts.quoteCreate ?? jest.fn(async () => ({ id: 'q' })),
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

  it('skips quoting for a same-asset pair and creates directly from the incoming payment', async () => {
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
    // No quote is ever created for a same-asset skip-quote run.
    expect(mocks.createQuote).not.toHaveBeenCalled()
    expect(mocks.createOutgoingPayment).toHaveBeenCalledTimes(10)
    expect(mocks.createOutgoingPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        incomingPayment: 'https://ip/1',
        debitAmount: { value: '100', assetCode: 'EUR', assetScale: 2 }
      })
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
