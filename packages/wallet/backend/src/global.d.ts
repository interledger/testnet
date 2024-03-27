import type { Response } from 'express'
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
    TBody = TypedResponseBody<TData>
  > extends Response {
    json: Send<TBody, this>
  }

  interface BigInt {
    toJSON(): string
  }
}
