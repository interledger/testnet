// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('../knexfile.js')

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Application } from 'express'
import Knex from 'knex'
import { Model } from 'objection'
import passport from 'passport'
import { jwtStrategy } from './auth/jwtStrategy.js'
import env from './config/env.js'

import { errorHandler } from './middlewares/errorHandler'
import { mainRouter } from './routes.js'
import { getAcceptableIDtypesByCountry } from './rapyd/verification/index.js'

const app: Application = express()

app.disable('X-Powered-By')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const knex = Knex(config[env.NODE_ENV || 'development'])
Model.knex(knex)

app.use(passport.initialize())

passport.use(jwtStrategy)

app.use(mainRouter)

app.use(errorHandler)

getAcceptableIDtypesByCountry('US').then((res) => console.log(res))

app.listen(env.PORT, (): void => {
  console.log(`🚀 🌑 | Backend listening on ${env.PORT}`)
})
