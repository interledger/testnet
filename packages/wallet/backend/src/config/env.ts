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
  GATEHUB_ACCESS_KEY: z.string().default('GATEHUB_ACCESS_KEY'),
  GATEHUB_SECRET_KEY: z.string().default('GATEHUB_SECRET_KEY'),
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
  DEFAULT_WALLET_ACCOUNT: z
    .object({
      email: z.string().default('dev@email.com'),
      password: z.string().default('123456'),
      lastName: z.string().default('Testnet'),
      firstName: z.string().default('Dev'),
      address: z.string().default('Den Lille Havfrue, Copenhagen, 2100'),
      country: z.string().default('DK'),
      rapydReferenceId: z.string().default('Dev-Testnet-fczr3D1E'),
      rapydWalletId: z
        .string()
        .default('ewallet_041c78fb4629be9cfc6387585cf768d5'),
      rapydContactId: z
        .string()
        .default('cont_88fc913a8ff13b07f3f1691e8d6af1ee'),
      kycId: z.string().default('kycid_f31a6c84afb905a24b5a7fcfbd2c2145')
    })
    .default({}),
  DEFAULT_BOUTIQUE_ACCOUNT: z
    .object({
      email: z.string().default('boutique@email.com'),
      password: z.string().default('123456'),
      lastName: z.string().default('Developer'),
      firstName: z.string().default('Boutique'),
      address: z.string().default('Den Lille Havfrue, Copenhagen, 2100'),
      country: z.string().default('DK'),
      rapydReferenceId: z.string().default('Boutique-developer-QxeW1mL1'),
      rapydWalletId: z
        .string()
        .default('ewallet_66dbae421de2de4802d4e7f8e6327767'),
      rapydContactId: z
        .string()
        .default('cont_11ed9bb3fe6a63393c5d836d7894526b'),
      kycId: z.string().default('kycid_5a9153132ae0769b198b4f4adfff2b58')
    })
    .default({}),
  DEFAULT_BOUTIQUE_KEYS: z
    .object({
      private_key: z
        .string()
        .default(
          'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1DNENBUUF3QlFZREsyVndCQ0lFSUI0YzgyOVlSMDZCTUhtQmpIVTNrOHZmMEZhVEFvOHNCTzIrRFZwY1lPSk0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQ=='
        ),
      public_key: z
        .string()
        .default(
          'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUNvd0JRWURLMlZ3QXlFQXRteGJxWEZBMWNtT2k2bkZ6bHVxajFqSkRTb2lTYkwvZ2Y3blA0ZERDQU09Ci0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQ=='
        ),
      key_id: z.string().default('32499ede-78d9-424d-a43e-3796ee07b60c')
    })
    .default({})
})

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Error parsing environment variables:', result.error.flatten())
  process.exit(1)
}

export const env = result.data
