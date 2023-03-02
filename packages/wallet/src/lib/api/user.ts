import type { AxiosError } from 'axios'
import { z } from 'zod'
import $axios, { type ErrorResponse, type SuccessResponse } from '../axios'

export const signUpSchema = z
  .object({
    email: z.string().email({ message: 'Email is required' }),
    password: z
      .string()
      .min(6, { message: 'Password should be at least 6 characters long' }),
    confirmPassword: z.string()
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

interface Service {
  signUp: (
    args: SignUpArgs
  ) => Promise<SuccessResponse | SignUpError | undefined>
}

type SignUpArgs = z.infer<typeof signUpSchema>
type SignUpError = ErrorResponse<typeof signUpSchema>

class UserService implements Service {
  private static instance: UserService

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
  }

  async signUp(args: SignUpArgs) {
    try {
      const response = await $axios.post<SuccessResponse>('/signup', args)
      return response.data
    } catch (e) {
      const error = e as AxiosError<SignUpError>
      return error.response?.data
    }
  }
}

export const userService = UserService.getInstance()
