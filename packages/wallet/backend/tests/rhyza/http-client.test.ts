import { AxiosError, InternalAxiosRequestConfig } from 'axios'
import {
  BadRequest,
  Conflict,
  InternalServerError,
  NotFound
} from '@shared/backend'
import { HttpClient, RhyzaServerError } from '@/rhyza/http-client'
import { lastRequest, mockAdapter, mockLogger, respond } from './helpers'

describe('Rhyza HttpClient', () => {
  let adapter: ReturnType<typeof mockAdapter>['adapter']
  let restore: () => void
  let logger: ReturnType<typeof mockLogger>
  let client: HttpClient

  beforeEach(() => {
    ;({ adapter, restore } = mockAdapter())
    logger = mockLogger()
    client = new HttpClient(
      { baseUrl: 'http://rhyza.test/', headers: { 'x-default': 'a' } },
      logger
    )
  })

  afterEach(() => {
    restore()
  })

  it('sends JSON to the joined URL and parses the JSON response', async () => {
    adapter.mockImplementationOnce(respond(201, { ok: true }))

    const result = await client.post('/things', { a: 1 })

    expect(result).toEqual({ ok: true })
    const request = lastRequest(adapter)
    expect(request.url).toBe('http://rhyza.test/things')
    expect(request.method).toBe('POST')
    expect(request.body).toEqual({ a: 1 })
    expect(request.headers['Content-Type']).toBe('application/json')
  })

  it('logs method, path and status at debug', async () => {
    adapter.mockImplementationOnce(respond(200, {}))

    await client.get('/things/1')

    expect(logger.debug).toHaveBeenCalledWith('GET /things/1 200')
  })

  it('merges per-request headers over the defaults', async () => {
    adapter.mockImplementationOnce(respond(200, {}))

    await client.get('/things', {
      headers: { 'x-default': 'b', 'x-extra': 'c' }
    })

    expect(lastRequest(adapter).headers).toMatchObject({
      'x-default': 'b',
      'x-extra': 'c'
    })
  })

  it('sends no body on GET', async () => {
    adapter.mockImplementationOnce(respond(200, {}))

    await client.get('/things')

    expect(lastRequest(adapter).body).toBeUndefined()
  })

  it('omits Content-Type on a bodyless POST', async () => {
    adapter.mockImplementationOnce(respond(202))

    await client.post('/things/1/accept')

    const request = lastRequest(adapter)
    expect(request.body).toBeUndefined()
    expect(request.headers).not.toHaveProperty('Content-Type')
  })

  it.each([202, 204])('returns undefined for an empty %s', async (status) => {
    adapter.mockImplementationOnce(respond(status))

    await expect(client.post('/things/1/accept')).resolves.toBeUndefined()
  })

  it.each([
    [400, BadRequest],
    [401, RhyzaServerError],
    [403, RhyzaServerError],
    [404, NotFound],
    [409, Conflict],
    [500, InternalServerError],
    [503, InternalServerError]
  ])('maps %s to %p', async (status, ErrorClass) => {
    adapter.mockImplementationOnce(respond(status))

    await expect(client.get('/things')).rejects.toBeInstanceOf(ErrorClass)
  })

  it('puts the Admin API `error` field in the message', async () => {
    adapter.mockImplementationOnce(
      respond(409, { error: 'Asset with code: USD already exists' })
    )

    await expect(client.get('/things')).rejects.toThrow(
      'Asset with code: USD already exists'
    )
  })

  it('puts the Fastify `message` field in the message', async () => {
    adapter.mockImplementationOnce(
      respond(404, { error: 'Not Found', message: 'Route not found' })
    )

    await expect(client.get('/things')).rejects.toThrow('Route not found')
  })

  it('puts a plain-text body in the message', async () => {
    adapter.mockImplementationOnce(respond(400, 'nope'))

    await expect(client.get('/things')).rejects.toThrow('nope')
  })

  it.each([400, 404, 409])(
    'logs a mapped %s at warn, not error',
    async (status) => {
      const body = { error: 'upstream detail' }
      adapter.mockImplementationOnce(respond(status, body))

      await client.get('/things').catch(() => undefined)

      expect(logger.warn).toHaveBeenCalledWith(`GET /things ${status}`, {
        body
      })
      expect(logger.error).not.toHaveBeenCalled()
    }
  )

  it('keeps 401 generic for the user and logs it', async () => {
    const body = { message: 'bad secret' }
    adapter.mockImplementationOnce(respond(401, body))

    const error = await client
      .get<never>('/things')
      .catch((e: RhyzaServerError) => e)

    expect(error.message).toBe('Internal Server Error')
    expect(error.statusCode).toBe(500)
    expect(logger.error).toHaveBeenCalledWith('GET /things 401', { body })
  })

  it('keeps 5xx messages generic but carries and logs the upstream body', async () => {
    const body = { code: '13', message: 'database exploded' }
    adapter.mockImplementationOnce(respond(500, body))

    const error = await client
      .get<never>('/things')
      .catch((e: RhyzaServerError) => e)

    expect(error).toBeInstanceOf(RhyzaServerError)
    expect(error.message).toBe('Internal Server Error')
    expect(error.status).toBe(500)
    expect(error.body).toEqual(body)
    expect(logger.error).toHaveBeenCalledWith('GET /things 500', { body })
  })

  it.each([AxiosError.ECONNABORTED, AxiosError.ETIMEDOUT])(
    'passes the timeout to axios and reports %s as a timeout',
    async (code) => {
      adapter.mockImplementationOnce(async (config) => {
        throw new AxiosError('timeout', code, config)
      })
      const fast = new HttpClient(
        { baseUrl: 'http://rhyza.test', timeoutMs: 20 },
        logger
      )

      await expect(fast.get('/slow')).rejects.toThrow(
        'Rhyza GET /slow timed out after 20ms'
      )
      expect(lastRequest(adapter).timeout).toBe(20)
    }
  )

  it('wraps network errors with method, path and code', async () => {
    let networkError: AxiosError | undefined
    adapter.mockImplementationOnce(
      async (config: InternalAxiosRequestConfig) => {
        networkError = new AxiosError(
          'connect ECONNREFUSED',
          'ECONNREFUSED',
          config
        )
        throw networkError
      }
    )

    const error = await client.get<never>('/things').catch((e: Error) => e)

    expect(error).not.toBeInstanceOf(AxiosError)
    expect(error.message).toBe('Rhyza GET /things failed: ECONNREFUSED')
    expect(error.cause).toBe(networkError)
  })

  it('rethrows non-axios errors unchanged', async () => {
    const boom = new TypeError('boom')
    adapter.mockImplementationOnce(async () => {
      throw boom
    })

    await expect(client.get('/things')).rejects.toBe(boom)
  })
})
