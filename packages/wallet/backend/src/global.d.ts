import type { Response, Request } from 'express'
import type { IronSession } from 'iron-session'

declare module 'iron-session' {
  interface IronSessionData {
    id: string
    user: UserSessionData
  }
}
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Send<ResBody = any, T = Response<ResBody>> = (body?: ResBody) => T

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type BaseResponseBody<T = any> = {
    success: boolean
    message: string
    data?: T
    errors?: Record<string, string>
  }

  type UserSessionData = {
    id: string
    email: string
    needsWallet: boolean
    needsIDProof: boolean
  }

  // eslint-disable-next-line @typescript-eslint/prefer-namespace-keyword
  declare module Express {
    interface Request {
      session: IronSession
    }
  }

  export interface CustomResponse<
    TData = undefined,
    TBody = BaseResponseBody<TData>
  > extends Response {
    json: Send<TBody, this>
  }

  type ControllerFunction<T = undefined> = (
    req: Request,
    res: CustomResponse<T>,
    next: NextFunction
  ) => Promise<void>

  interface BigInt {
    toJSON(): string
  }
}
