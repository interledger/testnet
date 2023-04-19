import { z } from 'zod'

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const d = require('dotenv')

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.string().default('development'),
  DB_URL: z
    .string()
    .default(
      'postgres://backend_wallet:backend_wallet@postgres/backend_wallet'
    ),
  JWT_ACCESS_TOKEN_SECRET: z.string().default('AT_SECRET'),
  JWT_ACCESS_TOKEN_EXPIRATION_TIME: z.coerce.number().default(2630000),
  JWT_REFRESH_TOKEN_SECRET: z.string().default('RT_SECRET'),
  JWT_REFRESH_TOKEN_EXPIRATION_TIME: z.coerce.number().default(2630000),
  RAPYD_API: z.string(),
  RAPYD_ACCESS_KEY: z.string(),
  RAPYD_SECRET_KEY: z.string(),
  RAPYD_SETTLEMENT_EWALLET: z.string(),
  GRAPHQL_ENDPOINT: z.string().url(),
  OPEN_PAYMENTS_HOST: z.string().url()
})

type ENV = z.infer<typeof envSchema>

const env: ENV = (() => {
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

// const env = d.config()
export default env
