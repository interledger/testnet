import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.string().default('development'),
  DB_URL: z.string().default('postgres://postgres:password@postgres/testnet'),
  JWT_ACCESS_TOKEN_SECRET: z.string().default('AT_SECRET'),
  JWT_ACCESS_TOKEN_EXPIRATION_TIME: z.coerce.number().default(2630000),
  JWT_REFRESH_TOKEN_SECRET: z.string().default('RT_SECRET'),
  JWT_REFRESH_TOKEN_EXPIRATION_TIME: z.coerce.number().default(2630000),
  RAPYD_API: z.string().default('https://sandboxapi.rapyd.net/v1'),
  RAPYD_ACCESS_KEY: z.string().default('RAPYD_ACCESS_KEY'),
  RAPYD_SECRET_KEY: z.string().default('RAPYD_SECRET_KEY'),
  GRAPHQL_ENDPOINT: z.string().url().default('http://backend:3001/graphql'),
  OPEN_PAYMENTS_HOST: z.string().url().default('https://backend:80')
})

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Error parsing environment variables:', result.error.flatten())
  process.exit(1)
}

export const env = result.data
