// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('../knexfile.js')

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Application } from 'express'
import Knex from 'knex'
import { Model } from 'objection'
import passport from 'passport'
import { jwtStrategy } from './auth/jwtStrategy'
import env from './config/env'

import { errorHandler } from './middlewares/errorHandler'
import { mainRouter } from './routes'

const app: Application = express()

app.disable('X-Powered-By')

app.use(
  cors({
    origin: 'http://localhost:4003',
    credentials: true
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const knex = Knex(config[env.NODE_ENV || 'development'])

Model.knex(knex)
;(async () => {
  knex.migrate.latest({
    directory: __dirname + '/../migrations'
  })
})()

app.use(passport.initialize())

passport.use(jwtStrategy)

app.use(mainRouter)

app.use(errorHandler)

app.listen(env.PORT, (): void => {
  console.log(`🚀 🌑 | Backend listening on ${env.PORT}`)
})
