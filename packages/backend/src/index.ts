import express, { Application } from 'express'

import cors from 'cors'
import * as dotenv from 'dotenv'
import Knex from 'knex'
import { Model } from 'objection'
dotenv.config()

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('./database/knexfile.js')

import passport from 'passport'
import { mainRouter } from './routes.js'

import { jwtStrategy } from './auth/jwtStrategy.js'

const app: Application = express()

app.disable('X-Powered-By')

app.use(cors())
app.use(express.json())

const knex = Knex(config[process.env.NODE_ENV || 'development'])
Model.knex(knex)

app.use(passport.initialize())

passport.use(jwtStrategy)

app.use(mainRouter)

// app.use(errorHandler)

app.listen(process.env.PORT, (): void => {
  console.log(`🚀 🌑 | Backend listening on ${process.env.PORT}`)
})
