import type { Response } from 'express'
import type { IronSession } from 'iron-session'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Send<ResBody = any, T = Response<ResBody>> = (body?: ResBody) => T

  interface UserSessionData {
    id: string
    email: string
    needsWallet: boolean
    needsIDProof: boolean
    customerId?: string
  }

  interface IronSessionData {
    id: string
    user: UserSessionData
  }

  namespace Express {
    interface Request {
      session: IronSession<IronSessionData>
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

declare module 'http' {
  interface IncomingMessage {
    session: IronSession<IronSessionData>
  }
}
