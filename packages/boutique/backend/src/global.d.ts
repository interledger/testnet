import type { Response } from 'express'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Send<ResBody = any, T = Response<ResBody>> = (body?: ResBody) => T

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface TypedResponseBody<T = any> {
    success: boolean
    message: string
    data?: T
    errors?: Record<string, string>
  }

  interface TypedResponse<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TData = undefined,
    TBody = TypedResponseBody<TData>
  > extends Response {
    json: Send<TBody, this>
  }

  type Controller<T = undefined> = (
    req: Request,
    res: CustomResponse<T>,
    next: NextFunction
  ) => Promise<void>
}
