import express from 'express'
import { authRouter } from './auth/auth.routes'

export const router = express.Router()

router.use('/auth', authRouter)
