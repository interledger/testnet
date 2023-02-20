import * as dotenv from 'dotenv'

import { resolve } from 'path'
import { object, string } from 'zod'

export const parseEnv = () => {
  const envPath = resolve(__dirname, '../../.env')

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
}
