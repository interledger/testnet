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

interface Service {
  signUp: (
    args: SignUpArgs
  ) => Promise<SuccessResponse | SignUpError | undefined>
  login: (args: LoginArgs) => Promise<SuccessResponse | LoginError | undefined>
  createWallet: (
    args: WalletArgs
  ) => Promise<SuccessResponse | WalletError | undefined>
  verifyIdentity: (
    args: VerifyIdentityArgs
  ) => Promise<SuccessResponse | VerifyIdentityError | undefined>
}

type SignUpArgs = z.infer<typeof signUpSchema>
type SignUpError = ErrorResponse<typeof signUpSchema>

type LoginArgs = z.infer<typeof loginSchema>
type LoginError = ErrorResponse<typeof loginSchema>

type WalletArgs = z.infer<typeof personalDetailsSchema>
type WalletError = ErrorResponse<typeof personalDetailsSchema>

type VerifyIdentityArgs = z.infer<typeof verifyIdentitySchema>
type VerifyIdentityError = ErrorResponse<typeof verifyIdentitySchema>

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

  async createWallet(args: WalletArgs) {
    try {
      const response = await $axios.post<SuccessResponse>('/wallet', args)
      return response.data
    } catch (e) {
      const error = e as AxiosError<WalletError>
      return error.response?.data
    }
  }

  async verifyIdentity(args: VerifyIdentityArgs) {
    try {
      const response = await $axios.post<SuccessResponse>('/verify', args)
      return response.data
    } catch (e) {
      const error = e as AxiosError<VerifyIdentityError>
      return error.response?.data
    }
  }
}

export const userService = UserService.getInstance()
