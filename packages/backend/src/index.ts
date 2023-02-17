import * as dotenv from 'dotenv'

import { resolve } from 'path'
import { object, string } from 'zod'

const envPath = resolve(__dirname, '../.env')

const envVars = dotenv.config({ path: envPath })

const envSchema = object({
  PORT: string(),
  DB_NAME: string(),
  DB_USERNAME: string(),
  DB_PASSWORD: string(),
  JWT_ACCESS_TOKEN_SECRET: string(),
  JWT_ACCESS_TOKEN_EXPIRATION_TIME: string(),
  JWT_REFRESH_TOKEN_SECRET: string(),
  JWT_REFRESH_TOKEN_EXPIRATION_TIME: string()
})

if (!envVars || !envVars.parsed) {
  throw new Error('Could not parse environment variables')
}

try {
  envSchema.parse(envVars.parsed)
} catch (err) {
  console.error('Error parsing environment variables:', err)
  process.exit(1)
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const config = require('../knexfile.js')

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Application } from 'express'
import Knex from 'knex'
import { Model } from 'objection'
import passport from 'passport'
import { jwtStrategy } from './auth/jwtStrategy.js'
import { errorHandler } from './errorHandler'
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
