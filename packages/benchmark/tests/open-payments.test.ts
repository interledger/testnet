import type {
  AuthenticatedClient,
  WalletAddress
} from '@interledger/open-payments'
import { BenchmarkClient } from '@/open-payments'

const payer = {
  id: 'https://wallet/alice',
  authServer: 'https://auth',
  resourceServer: 'https://rs',
  assetCode: 'EUR',
  assetScale: 2
} as unknown as WalletAddress

function makeClient(overrides: Record<string, unknown> = {}): {
  client: AuthenticatedClient
  mocks: Record<string, jest.Mock>
} {
  const mocks = {
    walletAddressGet: jest.fn(),
    grantRequest: jest.fn(),
    grantContinue: jest.fn(),
    incomingCreate: jest.fn(),
    incomingGet: jest.fn(),
    quoteCreate: jest.fn(),
    outgoingCreate: jest.fn(),
    outgoingGet: jest.fn(),
    tokenRotate: jest.fn()
  }
  const client = {
    walletAddress: { get: mocks.walletAddressGet },
    grant: { request: mocks.grantRequest, continue: mocks.grantContinue },
    incomingPayment: { create: mocks.incomingCreate, get: mocks.incomingGet },
    quote: { create: mocks.quoteCreate },
    outgoingPayment: { create: mocks.outgoingCreate, get: mocks.outgoingGet },
    token: { rotate: mocks.tokenRotate },
    ...overrides
  } as unknown as AuthenticatedClient
  return { client, mocks }
}

describe('BenchmarkClient', () => {
  it('getWalletAddress passes the url through', async () => {
    const { client, mocks } = makeClient()
    mocks.walletAddressGet.mockResolvedValue(payer)
    const bc = new BenchmarkClient(client)
    await bc.getWalletAddress('https://wallet/alice')
    expect(mocks.walletAddressGet).toHaveBeenCalledWith({
      url: 'https://wallet/alice'
    })
  })

  describe('nonInteractiveToken', () => {
    it('returns the access token value', async () => {
      const { client, mocks } = makeClient()
      mocks.grantRequest.mockResolvedValue({ access_token: { value: 'tok' } })
      const bc = new BenchmarkClient(client)
      const token = await bc.nonInteractiveToken('https://auth', 'quote', [
        'create'
      ])
      expect(token).toBe('tok')
    })

    it('throws when the grant is pending (interactive)', async () => {
      const { client, mocks } = makeClient()
      mocks.grantRequest.mockResolvedValue({ interact: { redirect: 'x' } })
      const bc = new BenchmarkClient(client)
      await expect(
        bc.nonInteractiveToken('https://auth', 'quote', ['create'])
      ).rejects.toThrow(/non-interactive/)
    })
  })

  it('createIncomingPayment posts to the resource server', async () => {
    const { client, mocks } = makeClient()
    mocks.incomingCreate.mockResolvedValue({ id: 'ip-1' })
    const bc = new BenchmarkClient(client)
    await bc.createIncomingPayment({
      receiver: payer,
      incomingAmount: { value: '1000', assetCode: 'EUR', assetScale: 2 },
      accessToken: 'itok',
      expiresAt: '2026-01-01T00:00:00Z'
    })
    expect(mocks.incomingCreate).toHaveBeenCalledWith(
      { url: 'https://rs', accessToken: 'itok' },
      expect.objectContaining({
        walletAddress: 'https://wallet/alice',
        incomingAmount: { value: '1000', assetCode: 'EUR', assetScale: 2 }
      })
    )
  })

  it('createQuote sends an ilp receiveAmount quote', async () => {
    const { client, mocks } = makeClient()
    mocks.quoteCreate.mockResolvedValue({ id: 'q-1' })
    const bc = new BenchmarkClient(client)
    const quote = await bc.createQuote({
      payer,
      receiver: 'https://rs/incoming/ip-1',
      receiveAmount: { value: '100', assetCode: 'EUR', assetScale: 2 },
      accessToken: 'qtok'
    })
    expect(quote).toEqual({ id: 'q-1' })
    expect(mocks.quoteCreate).toHaveBeenCalledWith(
      { url: 'https://rs', accessToken: 'qtok' },
      expect.objectContaining({
        method: 'ilp',
        receiver: 'https://rs/incoming/ip-1'
      })
    )
  })

  it('createOutgoingPayment posts the quote id', async () => {
    const { client, mocks } = makeClient()
    mocks.outgoingCreate.mockResolvedValue({ id: 'op-1' })
    const bc = new BenchmarkClient(client)
    await bc.createOutgoingPayment({
      payer,
      quoteId: 'q-1',
      accessToken: 'otok'
    })
    expect(mocks.outgoingCreate).toHaveBeenCalledWith(
      { url: 'https://rs', accessToken: 'otok' },
      expect.objectContaining({ quoteId: 'q-1' })
    )
  })

  it('getOutgoingPayment fetches by url with the token', async () => {
    const { client, mocks } = makeClient()
    mocks.outgoingGet.mockResolvedValue({
      id: 'https://op/1',
      failed: false,
      sentAmount: { value: '100', assetCode: 'EUR', assetScale: 2 },
      debitAmount: { value: '100', assetCode: 'EUR', assetScale: 2 }
    })
    const bc = new BenchmarkClient(client)
    const op = await bc.getOutgoingPayment('https://op/1', 'otok')
    expect(mocks.outgoingGet).toHaveBeenCalledWith({
      url: 'https://op/1',
      accessToken: 'otok'
    })
    expect(op.sentAmount.value).toBe('100')
  })

  describe('requestOutgoingPaymentGrant', () => {
    it('returns a pending grant handle', async () => {
      const { client, mocks } = makeClient()
      mocks.grantRequest.mockResolvedValue({
        interact: { redirect: 'https://consent' },
        continue: {
          uri: 'https://continue',
          access_token: { value: 'ctok' },
          wait: 5
        }
      })
      const bc = new BenchmarkClient(client)
      const handle = await bc.requestOutgoingPaymentGrant({
        payer,
        debitAmount: { value: '1000', assetCode: 'EUR', assetScale: 2 }
      })
      expect(handle).toEqual({
        redirect: 'https://consent',
        continueUri: 'https://continue',
        continueToken: 'ctok',
        wait: 5
      })
    })

    it('includes a recurring interval in the limits when given', async () => {
      const { client, mocks } = makeClient()
      mocks.grantRequest.mockResolvedValue({
        interact: { redirect: 'r' },
        continue: { uri: 'u', access_token: { value: 't' }, wait: 0 }
      })
      const bc = new BenchmarkClient(client)
      await bc.requestOutgoingPaymentGrant({
        payer,
        debitAmount: { value: '1000', assetCode: 'EUR', assetScale: 2 },
        interval: 'R/2026-01-01T00:00:00Z/P1D'
      })
      expect(mocks.grantRequest).toHaveBeenCalledWith(
        { url: 'https://auth' },
        expect.objectContaining({
          access_token: {
            access: [
              expect.objectContaining({
                limits: {
                  debitAmount: { value: '1000', assetCode: 'EUR', assetScale: 2 },
                  interval: 'R/2026-01-01T00:00:00Z/P1D'
                }
              })
            ]
          }
        })
      )
    })

    it('omits the interval for a single-use grant', async () => {
      const { client, mocks } = makeClient()
      mocks.grantRequest.mockResolvedValue({
        interact: { redirect: 'r' },
        continue: { uri: 'u', access_token: { value: 't' }, wait: 0 }
      })
      const bc = new BenchmarkClient(client)
      await bc.requestOutgoingPaymentGrant({
        payer,
        debitAmount: { value: '1000', assetCode: 'EUR', assetScale: 2 }
      })
      const body = mocks.grantRequest.mock.calls[0][1]
      expect(body.access_token.access[0].limits).toEqual({
        debitAmount: { value: '1000', assetCode: 'EUR', assetScale: 2 }
      })
    })

    it('defaults wait to 0 and rejects a non-pending grant', async () => {
      const { client, mocks } = makeClient()
      mocks.grantRequest.mockResolvedValueOnce({
        interact: { redirect: 'r' },
        continue: { uri: 'u', access_token: { value: 't' } }
      })
      const bc = new BenchmarkClient(client)
      const handle = await bc.requestOutgoingPaymentGrant({
        payer,
        debitAmount: { value: '1', assetCode: 'EUR', assetScale: 2 }
      })
      expect(handle.wait).toBe(0)

      mocks.grantRequest.mockResolvedValueOnce({ access_token: { value: 't' } })
      await expect(
        bc.requestOutgoingPaymentGrant({
          payer,
          debitAmount: { value: '1', assetCode: 'EUR', assetScale: 2 }
        })
      ).rejects.toThrow(/pending/)
    })
  })

  describe('continueGrant', () => {
    it('returns null while pending', async () => {
      const { client, mocks } = makeClient()
      mocks.grantContinue.mockResolvedValue({ continue: { uri: 'x' } })
      const bc = new BenchmarkClient(client)
      expect(await bc.continueGrant('u', 't')).toBeNull()
    })

    it('returns the token bundle when approved', async () => {
      const { client, mocks } = makeClient()
      mocks.grantContinue.mockResolvedValue({
        access_token: { value: 'atok', manage: 'https://manage' }
      })
      const bc = new BenchmarkClient(client)
      expect(await bc.continueGrant('u', 't')).toEqual({
        accessToken: 'atok',
        manageUrl: 'https://manage'
      })
    })
  })

  it('rotateToken unwraps the nested access_token', async () => {
    const { client, mocks } = makeClient()
    mocks.tokenRotate.mockResolvedValue({
      access_token: { value: 'new', manage: 'https://manage2' }
    })
    const bc = new BenchmarkClient(client)
    expect(await bc.rotateToken('https://manage', 'old')).toEqual({
      accessToken: 'new',
      manageUrl: 'https://manage2'
    })
  })

  it('getIncomingPayment reads via the client', async () => {
    const { client, mocks } = makeClient()
    mocks.incomingGet.mockResolvedValue({ receivedAmount: { value: '5' } })
    const bc = new BenchmarkClient(client)
    const ip = await bc.getIncomingPayment('https://ip', 'itok')
    expect(ip.receivedAmount.value).toBe('5')
  })
})
