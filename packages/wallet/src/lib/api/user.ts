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

export const personalDetailsSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  country: z.string(),
  city: z.string().min(1, { message: 'City is required' }),
  address: z.string().min(1, { message: 'Address is required' }),
  zip: z.string().min(1, { message: 'ZIP code is required' })
})

export const verifyIdentitySchema =
  process.env.NODE_ENV === 'development'
    ? z.object({
        documentType: z.string({
          invalid_type_error: 'Please select an ID Type'
        }),
        frontSideImage: z.string(),
        frontSideImageType: z.string().optional(),
        backSideImage: z.string().optional(),
        backSideImageType: z.string().optional(),
        faceImage: z.string(),
        faceImageType: z.string().optional()
      })
    : z.object({
        documentType: z.string({
          invalid_type_error: 'Please select an ID Type'
        }),
        frontSideImage: z
          .custom<FileList>()
          .refine(
            (frontSideImage) => frontSideImage?.length === 1,
            'Front side of ID is required'
          )
          .refine(
            (frontSideImage) => frontSideImage?.length < 2,
            'You can only select one image'
          ),
        frontSideImageType: z.string().optional(),
        backSideImage: z
          .custom<FileList>()
          .refine(
            (backSideImage) => backSideImage?.length === 1,
            'Back side of ID is required'
          )
          .refine(
            (backSideImage) => backSideImage?.length < 2,
            'You can only select one image'
          )
          .optional(),
        backSideImageType: z.string().optional(),
        faceImage: z
          .custom<FileList>()
          .refine((faceImage) => faceImage?.length === 1, 'Selfie is required')
          .refine(
            (faceImage) => faceImage?.length < 2,
            'You can only select one image'
          ),
        faceImageType: z.string().optional()
      })

export type UserData = {
  email: string
  firstName: string
  lastName: string
  noKyc: boolean
}

type SignUpArgs = z.infer<typeof signUpSchema>
type SignUpError = ErrorResponse<typeof signUpSchema>

type LoginArgs = z.infer<typeof loginSchema>
type LoginError = ErrorResponse<typeof loginSchema>

type WalletArgs = z.infer<typeof personalDetailsSchema>
type WalletError = ErrorResponse<typeof personalDetailsSchema>

type VerifyIdentityArgs = z.infer<typeof verifyIdentitySchema>
type VerifyIdentityError = ErrorResponse<typeof verifyIdentitySchema>

interface UserService {
  signUp: (args: SignUpArgs) => Promise<SuccessResponse | SignUpError>
  login: (args: LoginArgs) => Promise<SuccessResponse | LoginError>
  me: (cookies?: string) => Promise<SuccessResponse<UserData> | LoginError>
  createWallet: (args: WalletArgs) => Promise<SuccessResponse | WalletError>
  verifyIdentity: (
    args: VerifyIdentityArgs
  ) => Promise<SuccessResponse | VerifyIdentityError>
}

const createUserService = (): UserService => ({
  async signUp(args) {
    try {
      const response = await httpClient
        .post('signup', {
          json: args
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
          json: args
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
  },

  async createWallet(args: WalletArgs) {
    try {
      const response = await httpClient
        .post('/wallet', {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (e) {
      const error = e as HTTPError
      return error.response.json() as Promise<WalletError>
    }
  },

  async verifyIdentity(args: VerifyIdentityArgs) {
    try {
      const response = await httpClient
        .post('/verify', {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (e) {
      const error = e as HTTPError
      return error.response.json() as Promise<VerifyIdentityError>
    }
  }
})

export const userService = createUserService()
