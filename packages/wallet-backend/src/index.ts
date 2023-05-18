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
import { Domain } from 'domain'

BigInt.prototype.toJSON = function (this: bigint) {
  return this.toString()
}

const app: Application = express()

app.disable('X-Powered-By')

app.use(
  cors({
    origin: [
      'http://localhost:4003',
      'http://35.196.11.156',
      'https://35.196.11.156',
      'https://rafiki.money'
    ],
    credentials: true
  })
)
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: true, limit: '25mb' }))
app.use(cookieParser())

  




export const knex = Knex(config[env.NODE_ENV || 'development'])

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
