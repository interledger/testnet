import axios, { AxiosError, AxiosInstance } from 'axios'
import { Logger } from 'winston'
import {
  BadRequest,
  BaseError,
  Conflict,
  InternalServerError,
  NotFound
} from '@shared/backend'

const DEFAULT_TIMEOUT_MS = 10_000

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface HttpClientOptions {
  baseUrl: string
  headers?: Record<string, string>
  timeoutMs?: number
}

export interface RequestOptions {
  body?: unknown
  headers?: Record<string, string>
}

// Generic message for users; upstream status and body are kept for logs.
export class RhyzaServerError extends InternalServerError {
  constructor(
    public readonly status: number,
    public readonly body: unknown
  ) {
    super()
    Object.setPrototypeOf(this, RhyzaServerError.prototype)
  }
}

export class HttpClient {
  private readonly axios: AxiosInstance
  private readonly timeoutMs: number

  constructor(
    options: HttpClientOptions,
    private logger: Logger
  ) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.axios = axios.create({
      baseURL: options.baseUrl.replace(/\/+$/, ''),
      headers: options.headers,
      timeout: this.timeoutMs,
      // Lenient parse so plain-text error bodies survive.
      responseType: 'text',
      transformResponse: (data: string) => (data ? parseBody(data) : undefined)
    })
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options)
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, { ...options, body })
  }

  async request<T>(
    method: Method,
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const hasBody = options.body !== undefined
    try {
      const response = await this.axios.request<T>({
        method,
        url: path,
        data: hasBody ? JSON.stringify(options.body) : undefined,
        // Fastify rejects an empty body with a content type.
        headers: {
          'Content-Type': hasBody ? 'application/json' : false,
          ...options.headers
        }
      })
      this.logger.debug(`${method} ${path} ${response.status}`)
      return response.data
    } catch (e) {
      if (!(e instanceof AxiosError)) throw e
      if (!e.response) {
        if (
          e.code === AxiosError.ECONNABORTED ||
          e.code === AxiosError.ETIMEDOUT
        ) {
          throw new Error(
            `Rhyza ${method} ${path} timed out after ${this.timeoutMs}ms`,
            { cause: e }
          )
        }
        // The shared error handler would log a blank line for this AxiosError.
        throw new Error(
          `Rhyza ${method} ${path} failed: ${e.code ?? e.message}`,
          { cause: e }
        )
      }

      const { status, data: body } = e.response
      this.logger.debug(`${method} ${path} ${status}`)
      const error = toError(status, body)
      if (error instanceof RhyzaServerError) {
        this.logger.error(`${method} ${path} ${status}`, { body })
      } else {
        this.logger.warn(`${method} ${path} ${status}`, { body })
      }
      throw error
    }
  }
}

function parseBody(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

// Admin API uses `error`; Fastify uses `message`.
function messageFrom(body: unknown): string | undefined {
  if (typeof body === 'string') return body || undefined
  if (body && typeof body === 'object') {
    const { message, error } = body as Record<string, unknown>
    if (typeof message === 'string') return message
    if (typeof error === 'string') return error
  }
  return undefined
}

// 401/403 means our credentials are wrong, not the user's.
function toError(status: number, body: unknown): BaseError {
  const message = messageFrom(body)
  switch (status) {
    case 400:
      return new BadRequest(message ?? 'Bad Request')
    case 404:
      return new NotFound(message)
    case 409:
      return new Conflict(message ?? 'Conflict')
    default:
      return new RhyzaServerError(status, body)
  }
}
