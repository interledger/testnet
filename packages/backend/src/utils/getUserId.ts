import { Request } from 'express'

export function getUserIdFromRequest(req: Request): string {
  return req.user?.id ?? ''
}
