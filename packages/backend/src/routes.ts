import express, { Request, Response } from 'express'
import passport from 'passport'
import { login, refresh, signup } from './auth/auth.service'
import {
  create as createAsset,
  getById as getAssetById,
  list as listAsset
} from './asset/asset.service'
import {
  createPaymentPointer,
  getPaymentPointerById,
  listPaymentPointers
} from './payment-pointer/payment-pointer.service'
import {
  createAccount,
  getAccountById,
  listAccounts
} from './account/account.service'

export const mainRouter = express.Router()

mainRouter.post('/signup', signup)
mainRouter.post('/login', login)
mainRouter.post('/refresh', refresh)

mainRouter.post(
  '/protected',
  passport.authenticate('jwt', { session: false }),
  (_req, res) => {
    res.status(200).json({ success: true })
  }
)

// asset
mainRouter.post(
  '/assets',
  passport.authenticate('jwt', { session: false }),
  createAsset
)
mainRouter.get(
  '/assets',
  passport.authenticate('jwt', { session: false }),
  listAsset
)
mainRouter.get(
  '/assets/:id',
  passport.authenticate('jwt', { session: false }),
  getAssetById
)

// accounts
mainRouter.post(
  '/accounts',
  passport.authenticate('jwt', { session: false }),
  createAccount
)
mainRouter.get(
  '/accounts',
  passport.authenticate('jwt', { session: false }),
  listAccounts
)
mainRouter.get(
  '/accounts/:id',
  passport.authenticate('jwt', { session: false }),
  getAccountById
)

// payment-pointer
mainRouter.post(
  '/accounts/:accountId/payment-pointers',
  passport.authenticate('jwt', { session: false }),
  createPaymentPointer
)
mainRouter.get(
  '/accounts/:accountId/payment-pointers',
  passport.authenticate('jwt', { session: false }),
  listPaymentPointers
)
mainRouter.get(
  '/accounts/:accountId/payment-pointers/:id',
  passport.authenticate('jwt', { session: false }),
  getPaymentPointerById
)

mainRouter.use('*', (req: Request, res: Response) => {
  const err = Error(`Requested path ${req.path} not found`)
  res.status(404).send({
    success: false,
    message: 'Requested path ${req.path} not found',
    stack: err.stack
  })
})
