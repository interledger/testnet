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
  GATEHUB_ACCESS_KEY: z.string().default('GATEHUB_ACCESS_KEY'),
  GATEHUB_SECRET_KEY: z.string().default('GATEHUB_SECRET_KEY'),
  GATEHUB_GATEWAY_UUID: z.string().default('GATEHUB_GATEWAY_UUID'),
  GATEHUB_VAULT_UUID_EUR: z.string().default('GATEHUB_VAULT_UUID_EUR'),
  GATEHUB_VAULT_UUID_USD: z.string().default('GATEHUB_VAULT_UUID_USD'),
  GATEHUB_SETTLEMENT_WALLET_ADDRESS: z
    .string()
    .default('GATEHUB_SETTLEMENT_WALLET_ADDRESS'),
  GRAPHQL_ENDPOINT: z.string().url().default('http://localhost:3011/graphql'),
  AUTH_GRAPHQL_ENDPOINT: z
    .string()
    .url()
    .default('http://rafiki-auth:3008/graphql'),
  AUTH_DOMAIN: z.string().url().default('http://rafiki-auth:3006'),
  AUTH_IDENTITY_SERVER_SECRET: z.string().default('replace-me'),
  OPEN_PAYMENTS_HOST: z.string().url().default('https://backend:80'),
  RAFIKI_MONEY_FRONTEND_HOST: z.string().default('localhost'),
  SENDGRID_API_KEY: z.string().default('SG.API_KEY'),
  FROM_EMAIL: z.string().default('tech@interledger.org'),
  SEND_EMAIL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true')
})

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Error parsing environment variables:', result.error.flatten())
  process.exit(1)
}

export const env = result.data
