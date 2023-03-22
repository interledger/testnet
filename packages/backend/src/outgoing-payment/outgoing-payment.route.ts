import express from 'express'
import passport from 'passport'
import { continueRequest, createPayment } from './outgoing-payment.service'

export const outgoingPaymentRouter = express.Router()

outgoingPaymentRouter.post(
  '/outgoing-payments',
  passport.authenticate('jwt', { session: false }),
  createPayment
)

outgoingPaymentRouter.get('/outgoing-payments-continue', continueRequest)
