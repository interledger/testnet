import { NotFound } from '@shared/backend'
import { HttpClient, RhyzaServerError } from '@/rhyza/http-client'
import { RhyzaIdpClient } from '@/rhyza/idp-client'
import { lastRequest, mockAdapter, mockLogger, respond } from './helpers'

describe('RhyzaIdpClient', () => {
  let adapter: ReturnType<typeof mockAdapter>['adapter']
  let restore: () => void
  let client: RhyzaIdpClient

  const grantResponse = {
    id: 'grant-1',
    state: 'PENDING',
    access: [
      {
        type: 'outgoing-payment',
        actions: ['create', 'read'],
        identifier: 'https://ilp.test/alice',
        limits: {
          debitAmount: { value: '1000', assetCode: 'USD', assetScale: 2 }
        }
      }
    ],
    subject: { sub_ids: [{ format: 'uri', id: 'https://ilp.test/alice' }] }
  }

  beforeEach(() => {
    ;({ adapter, restore } = mockAdapter())
    client = new RhyzaIdpClient(
      new HttpClient(
        { baseUrl: 'http://idp.test', headers: { 'x-idp-secret': 'shh' } },
        mockLogger()
      )
    )
  })

  afterEach(() => {
    restore()
  })

  describe('getGrant', () => {
    it('GETs /grant/{id} with the IdP secret', async () => {
      adapter.mockImplementationOnce(respond(200, grantResponse))

      await client.getGrant('grant/1')

      const request = lastRequest(adapter)
      expect(request.method).toBe('GET')
      expect(request.url).toBe('http://idp.test/grant/grant%2F1')
      expect(request.headers['x-idp-secret']).toBe('shh')
    })

    it('maps 200 to a Grant', async () => {
      adapter.mockImplementationOnce(respond(200, grantResponse))

      await expect(client.getGrant('grant-1')).resolves.toEqual({
        id: 'grant-1',
        state: 'PENDING',
        access: grantResponse.access,
        subjectIds: [{ format: 'uri', id: 'https://ilp.test/alice' }]
      })
    })

    it('defaults subjectIds to empty when the grant has no subject', async () => {
      adapter.mockImplementationOnce(
        respond(200, { ...grantResponse, subject: undefined })
      )

      const grant = await client.getGrant('grant-1')

      expect(grant.subjectIds).toEqual([])
    })

    it('raises NotFound on 404', async () => {
      adapter.mockImplementationOnce(respond(404, { message: 'Not Found' }))

      await expect(client.getGrant('missing')).rejects.toBeInstanceOf(NotFound)
    })

    it('raises NotFound when the IdP leaks a gRPC NOT_FOUND as 500', async () => {
      adapter.mockImplementationOnce(
        respond(500, {
          statusCode: 500,
          code: '5',
          error: 'Internal Server Error',
          message: "5 NOT_FOUND: Grant 'missing' not found"
        })
      )

      await expect(client.getGrant('missing')).rejects.toBeInstanceOf(NotFound)
    })

    it('keeps other 500s as server errors', async () => {
      adapter.mockImplementationOnce(
        respond(500, { statusCode: 500, code: '14' })
      )

      await expect(client.getGrant('grant-1')).rejects.toBeInstanceOf(
        RhyzaServerError
      )
    })
  })
})
