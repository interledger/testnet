import { z } from 'zod'

export interface UserResponse {
  email: string
  firstName: string
  lastName: string
  address: string
  needsWallet: boolean
  needsIDProof: boolean
}

export type ValidTokenResponse = {
  isValid: boolean
}

export const emailSchema = z.object({
  email: z.string().email({ message: 'Email is required' })
})

export const isValidPassword = (password: string): boolean => {
  if (typeof password !== 'string') return false
  if (password.length < 8) return false

  const containsUppercase = (ch: string) => /[A-Z]/.test(ch)
  const containsLowercase = (ch: string) => /[a-z]/.test(ch)
  const containsSpecialChar = (ch: string) =>
    // eslint-disable-next-line no-useless-escape
    /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(ch)
  let countOfUpperCase = 0,
    countOfLowerCase = 0,
    countOfNumbers = 0,
    countOfSpecialChar = 0
  for (let i = 0; i < password.length; i++) {
    const ch = password.charAt(i)
    if (!isNaN(+ch)) countOfNumbers++
    else if (containsUppercase(ch)) countOfUpperCase++
    else if (containsLowercase(ch)) countOfLowerCase++
    else if (containsSpecialChar(ch)) countOfSpecialChar++
  }

  if (
    countOfLowerCase < 1 ||
    countOfUpperCase < 1 ||
    countOfSpecialChar < 1 ||
    countOfNumbers < 1
  ) {
    return false
  }
  return true
}

export const signUpSchema = z
  .object({
    email: z.string().email({ message: 'Email is required' }),
    password: z
      .string()
      .min(8, { message: 'Password should be at least 8 characters long' }),
    confirmPassword: z.string(),
    userAgreement: z.boolean().default(false)
  })
  .superRefine(({ password }, ctx) => {
    if (!isValidPassword(password)) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Password must contain at least one number and one special character and have a mixture of uppercase and lowercase letters',
        path: ['password']
      })
    }
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords must match',
        path: ['confirmPassword']
      })
    }
  })

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email is required' }),
  password: z.string().min(1, { message: 'Password is required' })
})
