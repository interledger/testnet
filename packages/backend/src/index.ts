import { parseEnv } from './config/envParser.js'
parseEnv()
// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('../knexfile.js')

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Application } from 'express'
import Knex from 'knex'
import { Model } from 'objection'
import passport from 'passport'
import { jwtStrategy } from './auth/jwtStrategy.js'

import { errorHandler } from './middlewares/errorHandler'
import { mainRouter } from './routes.js'

const app: Application = express()

app.disable('X-Powered-By')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const knex = Knex(config[process.env.NODE_ENV || 'development'])
Model.knex(knex)

app.use(passport.initialize())

passport.use(jwtStrategy)

app.use(mainRouter)

app.use(errorHandler)

app.listen(process.env.PORT, (): void => {
  console.log(`🚀 🌑 | Backend listening on ${process.env.PORT}`)
})
