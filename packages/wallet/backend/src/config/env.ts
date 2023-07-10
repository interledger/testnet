import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z
    .string()
    .default('postgres://postgres:password@localhost:5433/wallet_backend'),
  COOKIE_NAME: z.string().default('testnet.cookie'),
  COOKIE_PASSWORD: z
    .string()
    .default('testnet.cookie.password.super.secret.ilp'), // min. 32 chars
  COOKIE_TTL: z.coerce.number().default(2630000), // 1 month
  RAPYD_API: z.string().default('https://sandboxapi.rapyd.net/v1'),
  RAPYD_ACCESS_KEY: z.string().default('RAPYD_ACCESS_KEY'),
  RAPYD_SECRET_KEY: z.string().default('RAPYD_SECRET_KEY'),
  GRAPHQL_ENDPOINT: z.string().url().default('http://localhost:3011/graphql'),
  AUTH_GRAPHQL_ENDPOINT: z
    .string()
    .url()
    .default('http://rafiki-auth:3008/graphql'),
  OPEN_PAYMENTS_HOST: z.string().url().default('https://backend:80'),
  RAPYD_SETTLEMENT_EWALLET: z.string().default('default_ewallet'),
  RAFIKI_MONEY_FRONTEND_HOST: z.string().default('localhost')
})

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Error parsing environment variables:', result.error.flatten())
  process.exit(1)
}

export const env = result.data
