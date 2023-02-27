import { z } from 'zod'
import * as dotenv from "dotenv"

const envSchema = z.object({
  PORT: z.coerce.number(),
  NODE_ENV: z.string().default('development'),
  DB_URL: z.string(),
  JWT_ACCESS_TOKEN_SECRET: z.string(),
  JWT_ACCESS_TOKEN_EXPIRATION_TIME: z.coerce.string(),
  JWT_REFRESH_TOKEN_SECRET: z.string(),
  JWT_REFRESH_TOKEN_EXPIRATION_TIME: z.coerce.number()
})

type ENV = z.infer<typeof envSchema>

const env: ENV = (() => {
  dotenv.config()
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    console.error(
      'Error parsing environment variables:',
      result.error.flatten()
    )
    process.exit(1)
  }

  return result.data
})()

export default env
