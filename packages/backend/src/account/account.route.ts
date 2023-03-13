import express from 'express'
import passport from 'passport'
import { createAccount, getAccountById, listAccounts } from './account.service'

export const accountRouter = express.Router()

accountRouter.post(
  '',
  passport.authenticate('jwt', { session: false }),
  createAccount
)
accountRouter.get(
  '',
  passport.authenticate('jwt', { session: false }),
  listAccounts
)
accountRouter.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  getAccountById
)
