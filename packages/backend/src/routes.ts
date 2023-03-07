import express, { Request, Response } from 'express'
import passport from 'passport'
import { login, me, refresh, signup } from './auth/auth.service'
import { getCountryNames } from './rapyd/countries/countries.service'
import { createWallet } from './wallet/wallet.service'

export const mainRouter = express.Router()

mainRouter.use(function (req, _res, next) {
  req.setTimeout(500000, function () {
    // call back function is called when request timed out.
  })
  next()
})

mainRouter.post('/signup', signup)
mainRouter.post('/login', login)
mainRouter.post('/refresh', refresh)
mainRouter.get('/me', me)

mainRouter.post(
  '/wallet',
  // will be uncommented when jwt token is attached to header from frontend
  // passport.authenticate('jwt', { session: false }),
  createWallet
)

mainRouter.get('/countries', getCountryNames)

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
