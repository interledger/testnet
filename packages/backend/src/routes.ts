import express from 'express'
import passport from 'passport'
import { login, refresh, signup } from './auth/auth.service'

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
