import { getError } from '../httpClient'
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
type SignUpError = ErrorResponse<SignUpArgs | undefined>
type SignUpResponse = Promise<SuccessResponse | SignUpError>

type LoginArgs = z.infer<typeof loginSchema>
type LoginError = ErrorResponse<LoginArgs | undefined>
type LoginResponse = Promise<SuccessResponse | LoginError>

type MeResult = SuccessResponse<UserData>
type MeResponse = Promise<MeResult | ErrorResponse>

type CreateWalletArgs = z.infer<typeof personalDetailsSchema>
type CreateWalletError = ErrorResponse<CreateWalletArgs | undefined>
type CreateWalletResponse = Promise<SuccessResponse | CreateWalletError>

type VerifyIdentityArgs = z.infer<typeof verifyIdentitySchema>
type VerifyIdentityError = ErrorResponse<VerifyIdentityArgs | undefined>
type VerifyIdentityResponse = Promise<SuccessResponse | VerifyIdentityError>

interface UserService {
  signUp: (args: SignUpArgs) => SignUpResponse
  login: (args: LoginArgs) => LoginResponse
  me: (cookies?: string) => MeResponse
  createWallet: (args: CreateWalletArgs) => CreateWalletResponse
  verifyIdentity: (args: VerifyIdentityArgs) => VerifyIdentityResponse
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
    } catch (error) {
      return getError<SignUpError>(
        error,
        'We could not create your account. Please try again.'
      )
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
    } catch (error) {
      return getError<LoginError>(
        error,
        'We could not log you in. Please try again.'
      )
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
        .json<MeResult>()
      return response
    } catch (error) {
      return getError<ErrorResponse>(
        error,
        'Unable to retrive user information.'
      )
    }
  },

  async createWallet(args: CreateWalletArgs) {
    try {
      const response = await httpClient
        .post('/wallet', {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<CreateWalletError>(
        error,
        'Something went wrong while trying to create your wallet. Please try again.'
      )
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
    } catch (error) {
      return getError<VerifyIdentityError>(
        error,
        'Something went wrong while verifying your ID. Please try again.'
      )
    }
  }
})

export const userService = createUserService()
