import type { Handler, Request, Response } from 'express'

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
