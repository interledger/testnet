import express from 'express'
import passport from 'passport'
import { createPayment, getPayment } from './incoming-payment.service'

export const incomingPaymentRouter = express.Router()

incomingPaymentRouter.post(
  '/incoming-payments',
  passport.authenticate('jwt', { session: false }),
  createPayment
)

incomingPaymentRouter.get(
  '/payment-details',
  passport.authenticate('jwt', { session: false }),
  getPayment
)
