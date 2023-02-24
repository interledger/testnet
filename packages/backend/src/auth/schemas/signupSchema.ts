import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().email({ message: 'Email is required' }),
  password: z
    .string()
    .min(6, { message: 'Password is required, min. 6 chars' }),
  confirmPassword: z.string()
})
