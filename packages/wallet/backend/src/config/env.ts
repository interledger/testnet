import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z
    .string()
    .default('postgres://postgres:password@localhost:5433/wallet_backend'),
  REDIS_URL: z.string().default('redis://redis:6379/0'),
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
  AUTH_DOMAIN: z.string().url().default('http://rafiki-auth:3006'),
  AUTH_IDENTITY_SERVER_SECRET: z.string().default('replace-me'),
  OPEN_PAYMENTS_HOST: z.string().url().default('https://backend:80'),
  RAPYD_SETTLEMENT_EWALLET: z.string().default('default_ewallet'),
  RAFIKI_MONEY_FRONTEND_HOST: z.string().default('localhost'),
  SENDGRID_API_KEY: z.string().default('SG.API_KEY'),
  RATE_API_KEY: z.string().default('SG.API_KEY'),
  FROM_EMAIL: z.string().default('tech@interledger.org'),
  SEND_EMAIL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  BASE_ASSET_SCALE: z.coerce.number().nonnegative().default(2),
  MAX_ASSET_SCALE: z.coerce.number().nonnegative().default(9),
  WM_THRESHOLD: z.coerce.bigint().nonnegative().default(100_000_000n), // $0.1 in asset scale 9
  DEBT_THRESHOLD: z.coerce.number().multipleOf(0.01).nonnegative().default(5.0), // $5.00
  DEFAULT_AUTH_USERNAME: z.string().default('dev@email.com'),
  DEFAULT_BOUTIQUE_AUTH_USERNAME: z.string().default('boutique@mail.com'),
  DEFAULT_AUTH_PASSWORD: z.string().default('123456'),
  DEFAULT_WALLET_ID: z
    .string()
    .default('ewallet_041c78fb4629be9cfc6387585cf768d5'),
  DEFAULT_BOUTIQUE_WALLET_ID: z
    .string()
    .default('ewallet_91d58fd069725292f80dc21950767136')
})

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Error parsing environment variables:', result.error.flatten())
  process.exit(1)
}

export const env = result.data
