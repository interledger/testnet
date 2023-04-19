import express from 'express'
import passport from 'passport'
import {
  createPaymentPointer,
  getPaymentPointerById,
  listPaymentPointers
} from './payment-pointer.service'

export const paymentPointerRouter = express.Router()

paymentPointerRouter.post(
  '/accounts/:accountId/payment-pointers',
  passport.authenticate('jwt', { session: false }),
  createPaymentPointer
)
paymentPointerRouter.get(
  '/accounts/:accountId/payment-pointers',
  passport.authenticate('jwt', { session: false }),
  listPaymentPointers
)
paymentPointerRouter.get(
  '/accounts/:accountId/payment-pointers/:id',
  passport.authenticate('jwt', { session: false }),
  getPaymentPointerById
)
