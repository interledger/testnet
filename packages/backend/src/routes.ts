import express, { Request, Response } from 'express'
import passport from 'passport'
import { login, refresh, signup } from './auth/auth.service'
import { signupSchema } from './auth/schemas/signupSchema'
import { validate } from './middlewares/validator'
import { loginSchema } from './auth/schemas/loginSchema'

export const mainRouter = express.Router()

mainRouter.post('/signup', validate(signupSchema), signup)
mainRouter.post('/login', validate(loginSchema), login)
mainRouter.post('/refresh', refresh)

mainRouter.post(
  '/protected',
  passport.authenticate('jwt', { session: false }),
  (_req, res) => {
    res.status(200).json({ success: true })
  }
)

mainRouter.use('*', (req: Request, res: Response) => {
  const err = Error(`Requested path ${req.path} not found`)
  res.status(404).send({
    success: false,
    message: 'Requested path ${req.path} not found',
    stack: err.stack
  })
})
