import { Response } from 'express'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Send<ResBody = any, T = Response<ResBody>> = (body?: ResBody) => T

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type BaseResponseBody<T = any> = {
    success: boolean
    message: string
    data?: T
    errors?: Record<string, string>
  }

  interface CustomResponse<TData = undefined, TBody = BaseResponseBody<TData>>
    extends Response {
    json: Send<TBody, this>
  }
}
