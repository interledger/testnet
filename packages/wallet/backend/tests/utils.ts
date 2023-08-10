import type { Handler, Request, Response } from 'express'
import { withSession } from '@/middleware/withSession'
import { createUser } from '@/tests/helpers'
import { AuthService } from '@/auth/service'
import { mockLogInRequest } from '@/tests/mocks'
import { User } from '@/user/model'
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

export const loginUser = async ({
  req,
  res,
  authService,
  extraUserArgs
}: {
  req: Request
  res: Response
  authService: AuthService
  extraUserArgs: Partial<User>
}) => {
  const argsRegister = mockLogInRequest().body
  req.body = argsRegister

  await createUser({
    ...argsRegister,
    ...extraUserArgs
  })

  await applyMiddleware(withSession, req, res)

  const { user, session } = await authService.authorize(argsRegister)
  req.session.id = session.id
  req.session.user = {
    id: user.id,
    email: user.email,
    needsWallet: !user.rapydWalletId,
    needsIDProof: !user.kycId
  }

  return { user }
}
