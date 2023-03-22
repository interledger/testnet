import express from 'express'
import passport from 'passport'
import { listTransactions } from './transaction.service'

export const transactionsRouter = express.Router()

transactionsRouter.get(
  '/accounts/:accountId/payment-pointers/:paymentPointerId/transactions',
  passport.authenticate('jwt', { session: false }),
  listTransactions
)
