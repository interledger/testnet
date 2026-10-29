import { BadRequest, Conflict, NotFound } from '@shared/backend'
import { HttpClient } from '@/rhyza/http-client'
import { RhyzaAdminClient } from '@/rhyza/admin-client'
import { lastRequest, mockAdapter, mockLogger, respond } from './helpers'

describe('RhyzaAdminClient', () => {
  let adapter: ReturnType<typeof mockAdapter>['adapter']
  let restore: () => void
  let client: RhyzaAdminClient

  beforeEach(() => {
    ;({ adapter, restore } = mockAdapter())
    client = new RhyzaAdminClient(
      new HttpClient({ baseUrl: 'http://admin.test' }, mockLogger())
    )
  })

  afterEach(() => {
    restore()
  })

  describe('createAsset', () => {
    it('POSTs code and scale to /assets', async () => {
      adapter.mockImplementationOnce(respond(201, { code: 'USD' }))

      await client.createAsset('USD', 2)

      const request = lastRequest(adapter)
      expect(request.method).toBe('POST')
      expect(request.url).toBe('http://admin.test/assets')
      expect(request.body).toEqual({ code: 'USD', scale: 2 })
      expect(request.headers).not.toHaveProperty('x-idp-secret')
    })

    it('returns the created Asset on 201', async () => {
      adapter.mockImplementationOnce(respond(201, { code: 'USD' }))

      await expect(client.createAsset('USD', 2)).resolves.toEqual({
        code: 'USD',
        scale: 2
      })
    })

    it('raises Conflict on 409', async () => {
      adapter.mockImplementationOnce(
        respond(409, {
          error: '13 INTERNAL: Asset with code: USD already exists'
        })
      )

      await expect(client.createAsset('USD', 2)).rejects.toBeInstanceOf(
        Conflict
      )
    })
  })

  describe('listAssets', () => {
    it('GETs returns Asset list', async () => {
      adapter.mockImplementationOnce(respond(200, { assets: [] }))

      await client.listAssets()

      const request = lastRequest(adapter)
      expect(request.method).toBe('GET')
      expect(request.url).toBe('http://admin.test/assets')
    })
    it('returns the Asset list', async () => {
      adapter.mockImplementationOnce(
        respond(200, {
          assets: [
            { code: 'USD', scale: 2 },
            { code: 'EUR', scale: 2 }
          ]
        })
      )
      await expect(client.listAssets()).resolves.toEqual([
        { code: 'USD', scale: 2 },
        { code: 'EUR', scale: 2 }
      ])
    })
  })

  describe('createWalletAddress', () => {
    const args = {
      address: 'https://ilp.test/alice',
      assetCode: 'USD',
      publicName: 'Alice',
      isActive: true
    }

    it('POSTs the address details to /wallet-addresses', async () => {
      adapter.mockImplementationOnce(
        respond(201, { id: 'wa-1', address: 'ilp.test/alice' })
      )

      await client.createWalletAddress(args)

      const request = lastRequest(adapter)
      expect(request.method).toBe('POST')
      expect(request.url).toBe('http://admin.test/wallet-addresses')
      expect(request.body).toEqual(args)
    })

    it('returns the Rhyza id and address on 201', async () => {
      adapter.mockImplementationOnce(
        respond(201, { id: 'wa-1', address: 'ilp.test/alice' })
      )

      await expect(client.createWalletAddress(args)).resolves.toEqual({
        id: 'wa-1',
        address: 'ilp.test/alice'
      })
    })

    it('raises Conflict on 409', async () => {
      adapter.mockImplementationOnce(
        respond(409, {
          error:
            '13 INTERNAL: Wallet Address with that domain and pathName ilp.test/alice already exists'
        })
      )

      await expect(client.createWalletAddress(args)).rejects.toBeInstanceOf(
        Conflict
      )
    })
  })

  describe('createPaymentIntent', () => {
    const args = {
      walletAddress: 'https://ilp.test/alice',
      incomingAmount: 1000,
      expiresAt: new Date().toISOString(),
      metadata: { description: 'Free Money!' }
    }

    it('POSTs the payment intent details to /payment-intents', async () => {
      adapter.mockImplementationOnce(
        respond(201, {
          id: 'pi-1',
          openPaymentsUrl: 'https://ilp.test/pi-1'
        })
      )

      await client.createPaymentIntent(args)

      const request = lastRequest(adapter)
      expect(request.method).toBe('POST')
      expect(request.url).toBe('http://admin.test/payment-intents')
      expect(request.body).toEqual(args)
    })

    it('returns the payment intent id and open payments URL on 201', async () => {
      adapter.mockImplementationOnce(
        respond(201, {
          id: 'pi-1',
          openPaymentsUrl: 'https://ilp.test/pi-1'
        })
      )

      await expect(client.createPaymentIntent(args)).resolves.toEqual({
        id: 'pi-1',
        openPaymentsUrl: 'https://ilp.test/pi-1'
      })
    })

    it('raises NotFound on 404', async () => {
      adapter.mockImplementationOnce(
        respond(404, {
          error: "Wallet address 'https://ilp.test/alice' not found"
        })
      )

      await expect(client.createPaymentIntent(args)).rejects.toBeInstanceOf(
        NotFound
      )
    })
  })

  describe('getPaymentIntentById', () => {
    const paymentIntent = {
      id: 'pi-1',
      createdAt: '2026-10-19T13:52:00.855Z',
      state: 'CREATED',
      destination: 'https://ilp.test/alice',
      walletAddress: 'https://ilp.test/alice',
      incomingAmount: { value: '1000', assetCode: 'USD', assetScale: 2 },
      receivedAmount: { value: '0', assetCode: 'USD', assetScale: 2 },
      expiresAt: '2026-10-20T13:52:00.855Z'
    }

    it('GETs the payment intent details from /payment-intents/:id', async () => {
      adapter.mockImplementationOnce(respond(200, paymentIntent))

      await client.getPaymentIntentById('pi-1')

      const request = lastRequest(adapter)
      expect(request.method).toBe('GET')
      expect(request.url).toBe('http://admin.test/payment-intents/pi-1')
    })

    it('returns the payment intent on 200', async () => {
      adapter.mockImplementationOnce(respond(200, paymentIntent))

      await expect(client.getPaymentIntentById('pi-1')).resolves.toEqual(
        paymentIntent
      )
    })

    it('raises NotFound on 404', async () => {
      adapter.mockImplementationOnce(
        respond(404, { error: "Payment intent 'pi-1' not found" })
      )

      await expect(client.getPaymentIntentById('pi-1')).rejects.toBeInstanceOf(
        NotFound
      )
    })
  })

  describe('activateWalletAddress', () => {
    it('POSTs to /wallet-addresses/:id/activate', async () => {
      adapter.mockImplementationOnce(respond(200, {}))

      await client.activateWalletAddress('wa-1')

      const request = lastRequest(adapter)
      expect(request.method).toBe('POST')
      expect(request.url).toBe(
        'http://admin.test/wallet-addresses/wa-1/activate'
      )
    })
  })

  describe('deactivateWalletAddress', () => {
    it('POSTs to /wallet-addresses/:id/deactivate', async () => {
      adapter.mockImplementationOnce(respond(200, {}))

      await client.deactivateWalletAddress('wa-1')

      const request = lastRequest(adapter)
      expect(request.method).toBe('POST')
      expect(request.url).toBe(
        'http://admin.test/wallet-addresses/wa-1/deactivate'
      )
    })
  })

  describe('registerWalletAddressKey', () => {
    const walletAddressId = 'wa-1'
    const jwk = {
      alg: 'EdDSA' as const,
      crv: 'Ed25519' as const,
      kid: 'key-1',
      kty: 'OKP' as const,
      x: 'base64url-encoded-public-key'
    }

    it('POSTs the JWK to /wallet-addresses/:id/keys', async () => {
      adapter.mockImplementationOnce(respond(201, { id: 'key-1' }))

      await client.registerWalletAddressKey(jwk, walletAddressId)

      const request = lastRequest(adapter)
      expect(request.method).toBe('POST')
      expect(request.url).toBe('http://admin.test/wallet-addresses/wa-1/keys')
      expect(request.body).toEqual(jwk)
    })

    it('returns the key id on 201', async () => {
      adapter.mockImplementationOnce(respond(201, { id: 'key-1' }))

      await expect(
        client.registerWalletAddressKey(jwk, walletAddressId)
      ).resolves.toEqual({
        id: 'key-1'
      })
    })

    it('raises BadRequest on 400', async () => {
      adapter.mockImplementationOnce(
        respond(400, {
          error:
            '3 INVALID_ARGUMENT: JWK must be an Ed25519 public key (alg=EdDSA, kty=OKP, crv=Ed25519)'
        })
      )

      await expect(
        client.registerWalletAddressKey(jwk, walletAddressId)
      ).rejects.toBeInstanceOf(BadRequest)
    })

    it('raises NotFound on 404', async () => {
      adapter.mockImplementationOnce(
        respond(404, {
          error: '5 NOT_FOUND: Wallet Address with id wa-1 does not exist'
        })
      )

      await expect(
        client.registerWalletAddressKey(jwk, walletAddressId)
      ).rejects.toBeInstanceOf(NotFound)
    })

    it('raises Conflict on 409', async () => {
      adapter.mockImplementationOnce(
        respond(409, {
          error:
            '6 ALREADY_EXISTS: Wallet address key with kid bruno-client-key already exists'
        })
      )

      await expect(
        client.registerWalletAddressKey(jwk, walletAddressId)
      ).rejects.toBeInstanceOf(Conflict)
    })
  })
})
