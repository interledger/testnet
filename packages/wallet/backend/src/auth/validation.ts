import { z } from 'zod'

export const signUpSchema = z.object({
  body: z
    .object({
      email: z.string().email({ message: 'Email is required' }),
      password: z
        .string()
        .min(6, { message: 'Password should be at least 6 characters long' }),
      confirmPassword: z.string()
    })
    .superRefine(({ password, confirmPassword }, ctx) => {
      if (password !== confirmPassword) {
        ctx.addIssue({
          code: 'custom',
          message: `Passwords do not match`,
          path: ['confirmPassword']
        })
      }
    })
})

export const logInSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string()
  })
})

export const resendVerifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
})
