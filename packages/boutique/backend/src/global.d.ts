import type { Response } from 'express'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Send<ResBody = any, T = Response<ResBody>> = (body?: ResBody) => T

  interface TypedResponse<TData = undefined, TBody = TypedResponseBody<TData>>
    extends Response {
    json: Send<TBody, this>
  }
}
