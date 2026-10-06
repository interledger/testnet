import { Conflict } from '@shared/backend'
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
})
