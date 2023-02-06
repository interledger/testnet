import express from 'express'
import { authRouter } from './auth/auth.routes'

export const mainRouter = express.Router()

// Handle sign in
mainRouter.post('/signin', signIn)

// Handle refresh
mainRouter.post('/refresh', refresh)

mainRouter.use('/auth', authRouter)
