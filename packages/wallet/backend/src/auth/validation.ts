import { z } from 'zod'
import { emailSchema, loginSchema, signUpSchema } from '@wallet/shared'

export const signUpBodySchema = z.object({
  body: signUpSchema
})

export const logInBodySchema = z.object({
  body: loginSchema
})

export const emailBodySchema = z.object({
  body: emailSchema
})
