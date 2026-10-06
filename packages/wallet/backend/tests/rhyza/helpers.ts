import axios, {
  AxiosAdapter,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios'
import { Logger } from 'winston'

export const mockLogger = () =>
  ({
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }) as unknown as Logger

// Stands in for axios's network adapter; must be installed before the HttpClient is built.
export const mockAdapter = () => {
  const original = axios.defaults.adapter
  const adapter = jest.fn<
    ReturnType<AxiosAdapter>,
    [InternalAxiosRequestConfig]
  >()
  axios.defaults.adapter = adapter
  return {
    adapter,
    restore: () => {
      axios.defaults.adapter = original
    }
  }
}

// Mirrors axios's own settle(): non-2xx rejects with an AxiosError carrying the response.
export const respond =
  (status: number, body?: unknown) =>
  async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const response: AxiosResponse = {
      data:
        body === undefined
          ? ''
          : typeof body === 'string'
            ? body
            : JSON.stringify(body),
      status,
      statusText: '',
      headers: {},
      config
    }
    if (config.validateStatus?.(status) ?? true) return response
    throw new AxiosError(
      `Request failed with status code ${status}`,
      AxiosError.ERR_BAD_RESPONSE,
      config,
      null,
      response
    )
  }

export const lastRequest = (adapter: jest.Mock) => {
  const config = adapter.mock.calls.at(-1)?.[0] as InternalAxiosRequestConfig
  return {
    url: `${config.baseURL}${config.url}`,
    method: config.method?.toUpperCase(),
    headers: config.headers.toJSON() as Record<string, string>,
    timeout: config.timeout,
    body: config.data === undefined ? undefined : JSON.parse(config.data)
  }
}
