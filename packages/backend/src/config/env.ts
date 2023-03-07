// import { z } from 'zod'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const d = require('dotenv')

// const envSchema = z.object({
//   PORT: z.coerce.number(),
//   NODE_ENV: z.string().default('development'),
//   DB_URL: z.string(),
//   JWT_ACCESS_TOKEN_SECRET: z.string(),
//   JWT_ACCESS_TOKEN_EXPIRATION_TIME: z.coerce.string(),
//   JWT_REFRESH_TOKEN_SECRET: z.string(),
//   JWT_REFRESH_TOKEN_EXPIRATION_TIME: z.coerce.number(),
//   RAPYD_API: z.string(),
//   RAPYD_ACCESS_KEY: z.string(),
//   RAPYD_SECRET_KEY: z.string()
// })

// type ENV = z.infer<typeof envSchema>

// const env: ENV = (() => {

//   const result = envSchema.safeParse(process.env)

//   if (!result.success) {
//     console.error(
//       'Error parsing environment variables:',
//       result.error.flatten()
//     )
//     process.exit(1)
//   }

//   return result.data
// })()

// export default env

const env = d.config()
export default env
