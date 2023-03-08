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

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email is required' }),
  password: z.string().min(1, { message: 'Password is required' })
})

export type UserData = {
  email: string
  firstName: string
  lastName: string
  noKyc: boolean
}

interface Service {
  signUp: (
    args: SignUpArgs
  ) => Promise<SuccessResponse | SignUpError | undefined>
  login: (args: LoginArgs) => Promise<SuccessResponse | LoginError | undefined>
}

type SignUpArgs = z.infer<typeof signUpSchema>
type SignUpError = ErrorResponse<typeof signUpSchema>

type LoginArgs = z.infer<typeof loginSchema>
type LoginError = ErrorResponse<typeof loginSchema>

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

  async login(args: LoginArgs) {
    try {
      const response = await $axios.post<SuccessResponse>('/login', args)
      return response.data
    } catch (e) {
      const error = e as AxiosError<LoginError>
      return error.response?.data
    }
  }
}

export const userService = UserService.getInstance()
