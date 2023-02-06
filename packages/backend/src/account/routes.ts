import express from 'express'
import { requireJWT } from './auth.service'

const router = express.Router()

// Define protected routes that require a valid JWT
router.get('/protected', requireJWT, (req, res) => {
  res.send('Access granted')
})

export { router }
