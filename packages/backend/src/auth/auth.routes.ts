// import express, { Request, Response } from 'express'
// import { User } from '../user/models/user'
// import { login, signup } from './auth.service'

// export const authRouter = express.Router()

// authRouter.post('/signup', async (req: Request, res: Response) => {
//   const { username, password, email } = req.body as Omit<User, 'id'>

//   const user = await signup({ username, password, email })

//   return res.json(user)
// })

// authRouter.post('/login', async (req: Request, res: Response) => {
//   const { username, password } = req.body as Omit<User, 'id'>

//   const token = await login(username, password)

//   return res.json({ token })
// })

import express from 'express'
import { signIn, refresh } from './auth.service'

const router = express.Router()

// Handle sign in
router.post('/signin', signIn)

// Handle refresh
router.post('/refresh', refresh)

export { router as authRouter }
