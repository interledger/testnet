import { HTTPError } from 'ky'
import { z } from 'zod'
import {
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'

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

interface UserService {
  signUp: (
    args: SignUpArgs
  ) => Promise<SuccessResponse | SignUpError | undefined>
  login: (args: LoginArgs) => Promise<SuccessResponse | LoginError>
  me: (cookies?: string) => Promise<SuccessResponse<UserData> | LoginError>
}

type SignUpArgs = z.infer<typeof signUpSchema>
type SignUpError = ErrorResponse<typeof signUpSchema>

type LoginArgs = z.infer<typeof loginSchema>
type LoginError = ErrorResponse<typeof loginSchema>

const createUserService = (): UserService => ({
  async signUp(args) {
    try {
      const response = await httpClient
        .post('signup', {
          body: JSON.stringify(args)
        })
        .json<SuccessResponse>()
      return response
    } catch (e) {
      const error = e as HTTPError
      return error.response.json() as Promise<SignUpError>
    }
  },

  async login(args) {
    try {
      const response = await httpClient
        .post('login', {
          body: JSON.stringify(args)
        })
        .json<SuccessResponse>()
      return response
    } catch (e) {
      const error = e as HTTPError
      return error.response.json() as Promise<LoginError>
    }
  },

  async me(cookies) {
    try {
      const response = await httpClient
        .get('me', {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<SuccessResponse<UserData>>()
      return response
    } catch (e) {
      const error = e as HTTPError
      return error.response.json() as Promise<LoginError>
    }
  }
})

export const userService = createUserService()
