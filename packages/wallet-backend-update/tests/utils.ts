import type { Handler, Request, Response } from 'express'
export { v4 as uuid } from 'uuid'

export const applyMiddleware = async (
  middleware: Handler,
  req: Request,
  res: Response
): Promise<void> => {
  return new Promise((resolve, reject) => {
    middleware(req, res, (err: unknown) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
