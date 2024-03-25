import type { Response, Request, NextFunction } from 'express'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Send<ResBody = any, T = Response<ResBody>> = (body?: ResBody) => T

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TypedResponseBody<T = any> {
  success: boolean
  message: string
  result?: T
  errors?: Record<string, string>
}
export interface TypedResponse<
  TData = undefined,
  TBody = TypedResponseBody<TData>
> extends Response {
  json: Send<TBody, this>
}

export type Controller<T = undefined> = (
  req: Request,
  res: TypedResponse<T>,
  next: NextFunction
) => Promise<void>
