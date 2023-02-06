import express, { Application, Router } from 'express'

import * as dotenv from 'dotenv'
dotenv.config()

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('./database/knexfile.js')
import Knex from 'knex'
import { Model } from 'objection'
import cors from 'cors'

import passport from 'passport'
import { mainRouter } from './routes.js'

import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt'
import { User } from './user/models/user.js'
import { RefreshToken } from './auth/models/refreshToken.js'

const app: Application = express()
const router: Router = Router()

app.disable('X-Powered-By')

app.use(cors())
app.use(express.json())

const knex = Knex(config[process.env.NODE_ENV || 'development'])
Model.knex(knex)

app.use(passport.initialize())

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET
    },
    async (jwtPayload, done) => {
      try {
        // find the user in db if exists
        const user = await User.query().findById(jwtPayload.id)
        if (!user) {
          return done(null, false)
        }
        return done(null, user)
      } catch (error) {
        done(error)
      }
    }
  )
)

export const signup = async (req: express.Request, res: express.Response) => {
  try {
    // insert the new user in the db
    const user = await User.query().insert(req.body)

    // return 201 status code and the user
    return res.status(201).json({ user })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
}

export const login = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body

    // find the user in db by email and verify the password
    const user = await User.query()
      .findOne({ email })
      .select('id', 'email', 'password')
      .throwIfNotFound()

    const isValid = await user.verifyPassword(password)
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // generate jwt and refresh token
    const jwt = user.generateJWT()
    const refreshToken = user.generateRefreshToken()

    // store the refresh token in db
    await user.$relatedQuery('refreshTokens').insert({ token: refreshToken })

    // send the jwt and refresh token as cookies to the client
    res.cookie('jwt', jwt, { httpOnly: true })
    res.cookie('refreshToken', refreshToken, { httpOnly: true })

    return res.json({ user })
  } catch (error) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
}

export const refresh = async (req: express.Request, res: express.Response) => {
  const refreshToken = req.cookies.refreshToken

  if (!refreshToken) {
    return res.status(400).send({ message: 'No refresh token found' })
  }

  try {
    const token = await RefreshToken.verify(refreshToken)

    if (!token) {
      return res.status(400).send({ message: 'Invalid refresh token' })
    }

    const userId = await RefreshToken.getUserId(token)

    if (!userId) {
      res.status(500).send({ message: 'Given token has no user associated' })
    }

    const user = await User.query().findById(userId!)

    if (!user) {
      throw new Error()
      return res.status(400).send({ message: 'User not found' })
    }

    // generate a new JWT
    const newToken = user.generateJWT()

    // set the new JWT as a cookie
    res.cookie('jwt', newToken, { httpOnly: true })

    res.status(200).send({ message: 'Access token refreshed' })
  } catch (error) {
    console.error(error)
    res.status(500).send({ message: 'Refresh failed' })
  }
}

app.post('/signup', signup)
app.post('/login', login)

app.use(mainRouter)

// router.get(
//   '/',
//   async (_req: Request, res: Response<CustomResponse>, _next: NextFunction) => {
//     res.json({ message: '🐈' })
//   }
// )

// app.use(errorHandler)

app.listen(process.env.PORT, (): void => {
  console.log(`🚀 🌑 | Backend listening on ${process.env.PORT}`)
})
