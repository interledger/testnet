import { z } from 'zod'

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Email is required' })
  })
})

export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string()
  }),
  body: z
    .object({
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

export const changePasswordSchema = z.object({
  body: z
    .object({
      oldPassword: z.string(),
      newPassword: z
        .string()
        .min(6, { message: 'Password should be at least 6 characters long' }),
      confirmNewPassword: z.string()
    })
    .superRefine(({ newPassword, confirmNewPassword }, ctx) => {
      if (newPassword !== confirmNewPassword) {
        ctx.addIssue({
          code: 'custom',
          message: `Passwords do not match`,
          path: ['confirmNewPassword']
        })
      }
    })
})
