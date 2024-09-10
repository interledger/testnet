import { getError } from '../httpClient'
import { z } from 'zod'
import {
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'
import { ACCEPTED_IMAGE_TYPES } from '@/utils/constants'
import { SelectOption } from '@/ui/forms/Select'
import { UserResponse, ValidTokenResponse } from '@wallet/shared'

export const signUpSchema = z
  .object({
    email: z.string().email({ message: 'Email is required' }),
    password: z
      .string()
      .min(8, { message: 'Password should be at least 8 characters long' }),
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

    const containsUppercase = (ch: string) => /[A-Z]/.test(ch)
    const containsLowercase = (ch: string) => /[a-z]/.test(ch)
    const containsSpecialChar = (ch: string) =>
      // eslint-disable-next-line no-useless-escape
      /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(ch)
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
      ctx.addIssue({
        code: 'custom',
        message:
          'Password must contain at least one number and one special character and have a mixture of uppercase and lowercase letters.',
        path: ['password']
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
  country: z.object({
    value: z.string().length(2),
    label: z.string().min(1)
  }),
  city: z.string().min(1, { message: 'City is required' }),
  address: z.string().min(1, { message: 'Address is required' }),
  zip: z.string().min(1, { message: 'ZIP code is required' })
})

export const profileSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' })
})

export const verifyIdentitySchema = z
  .object({
    documentType: z.string({
      invalid_type_error: 'Please select an ID Type'
    }),
    frontSideImage: z
      .string()
      .min(1, { message: 'Front side of ID is required' }),
    frontSideImageType: z.string(),
    backSideImage: z.string().optional(),
    backSideImageType: z.string().optional(),
    faceImage: z.string().min(1, { message: 'A selfie image is required' }),
    faceImageType: z.string()
  })
  .superRefine(
    ({ frontSideImageType, faceImageType, backSideImageType }, ctx) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(frontSideImageType)) {
        ctx.addIssue({
          code: 'custom',
          message: `Image must be 'jpeg' or 'png'`,
          path: ['frontSideImage']
        })
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(faceImageType)) {
        ctx.addIssue({
          code: 'custom',
          message: `Image must be 'jpeg' or 'png'`,
          path: ['faceImage']
        })
      }
      if (
        backSideImageType &&
        backSideImageType?.length > 0 &&
        !ACCEPTED_IMAGE_TYPES.includes(backSideImageType)
      ) {
        ctx.addIssue({
          code: 'custom',
          message: `Image must be 'jpeg' or 'png'`,
          path: ['backSideImage']
        })
      }
    }
  )

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Email is required' })
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password should be at least 8 characters long' }),
    confirmPassword: z.string(),
    token: z.string()
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords must match',
        path: ['confirmPassword']
      })
    }

    const containsUppercase = (ch: string) => /[A-Z]/.test(ch)
    const containsLowercase = (ch: string) => /[a-z]/.test(ch)
    const containsSpecialChar = (ch: string) =>
      // eslint-disable-next-line no-useless-escape
      /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(ch)
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
      ctx.addIssue({
        code: 'custom',
        message:
          'Password must contain at least one number and one special character and have a mixture of uppercase and lowercase letters.',
        path: ['password']
      })
    }
  })

export const verifyEmailSchema = z.object({
  token: z.string()
})

export const changePasswordSchema = z
  .object({
    oldPassword: z.string(),
    newPassword: z.string().min(8, {
      message: 'Your new password has to be at least 8 characters long.'
    }),
    confirmNewPassword: z.string()
  })
  .superRefine(({ confirmNewPassword, newPassword }, ctx) => {
    if (confirmNewPassword !== newPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords must match.',
        path: ['confirmNewPassword']
      })
    }

    const containsUppercase = (ch: string) => /[A-Z]/.test(ch)
    const containsLowercase = (ch: string) => /[a-z]/.test(ch)
    const containsSpecialChar = (ch: string) =>
      // eslint-disable-next-line no-useless-escape
      /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(ch)
    let countOfUpperCase = 0,
      countOfLowerCase = 0,
      countOfNumbers = 0,
      countOfSpecialChar = 0
    for (let i = 0; i < newPassword.length; i++) {
      const ch = newPassword.charAt(i)
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
      ctx.addIssue({
        code: 'custom',
        message:
          'Password must contain at least one number and one special character and have a mixture of uppercase and lowercase letters.',
        path: ['newPassword']
      })
    }
  })

export type Document = {
  type: string
  name: string
  isBackRequired: boolean
}

type SignUpArgs = z.infer<typeof signUpSchema>
type SignUpError = ErrorResponse<SignUpArgs | undefined>
type SignUpResponse = SuccessResponse | SignUpError

type LoginArgs = z.infer<typeof loginSchema>
type LoginError = ErrorResponse<LoginArgs | undefined>
type LoginResponse = SuccessResponse | LoginError

type LogoutResponse = SuccessResponse | ErrorResponse

type ForgotPasswordArgs = z.infer<typeof forgotPasswordSchema>
type ForgotPasswordError = ErrorResponse<ForgotPasswordArgs | undefined>
type ForgotPasswordResponse = SuccessResponse | ForgotPasswordError

type ResetPasswordArgs = z.infer<typeof resetPasswordSchema>
type ResetPasswordError = ErrorResponse<ResetPasswordArgs | undefined>
type ResetPasswordResponse = SuccessResponse | ResetPasswordError

type CheckTokenResult = SuccessResponse<ValidTokenResponse>
type CheckTokenResponse = CheckTokenResult | ErrorResponse

type VerifyEmailArgs = z.infer<typeof verifyEmailSchema>
type VerifyEmailError = ErrorResponse<VerifyEmailArgs | undefined>
type VerifyEmailResponse = SuccessResponse | VerifyEmailError

type MeResult = SuccessResponse<UserResponse>
type MeResponse = MeResult | ErrorResponse

type CreateWalletArgs = z.infer<typeof personalDetailsSchema>
type CreateWalletError = ErrorResponse<CreateWalletArgs | undefined>
type CreateWalletResponse = SuccessResponse | CreateWalletError

type VerifyIdentityArgs = z.infer<typeof verifyIdentitySchema>
type VerifyIdentityError = ErrorResponse<VerifyIdentityArgs | undefined>
type VerifyIdentityResponse = SuccessResponse | VerifyIdentityError

type ProfileArgs = z.infer<typeof profileSchema>
type ProfileError = ErrorResponse<ProfileArgs | undefined>
type ProfileResponse = SuccessResponse | ProfileError

type ChangePasswordArgs = z.infer<typeof changePasswordSchema>
type ChangePasswordError = ErrorResponse<ChangePasswordArgs | undefined>
type ChangePasswordResponse = SuccessResponse | ChangePasswordError

interface UserService {
  signUp: (args: SignUpArgs) => Promise<SignUpResponse>
  login: (args: LoginArgs) => Promise<LoginResponse>
  logout: () => Promise<LogoutResponse>
  forgotPassword: (args: ForgotPasswordArgs) => Promise<ForgotPasswordResponse>
  resetPassword: (args: ResetPasswordArgs) => Promise<ResetPasswordResponse>
  checkToken: (token: string, cookies?: string) => Promise<CheckTokenResponse>
  verifyEmail: (args: VerifyEmailArgs) => Promise<VerifyEmailResponse>
  me: (cookies?: string) => Promise<MeResponse>
  createWallet: (args: CreateWalletArgs) => Promise<CreateWalletResponse>
  verifyIdentity: (args: VerifyIdentityArgs) => Promise<VerifyIdentityResponse>
  updateProfile: (args: ProfileArgs) => Promise<ProfileResponse>
  getDocuments: (cookies?: string) => Promise<Document[]>
  getCountries: (cookies?: string) => Promise<SelectOption[]>
  changePassword: (args: ChangePasswordArgs) => Promise<ChangePasswordResponse>
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
      return getError<SignUpArgs>(
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
      return getError<LoginArgs>(
        error,
        'We could not log you in. Please try again.'
      )
    }
  },

  async logout() {
    try {
      const response = await httpClient
        .post('logout', {
          headers: {}
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(error, 'We could not log you out. Please try again.')
    }
  },

  async forgotPassword(args) {
    try {
      const response = await httpClient
        .post('forgot-password', {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<ForgotPasswordArgs>(
        error,
        'Something went wrong. Please try again.'
      )
    }
  },

  async resetPassword(args) {
    try {
      const response = await httpClient
        .post(`reset-password/${args.token}`, {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<ResetPasswordArgs>(
        error,
        'We could not reset your password. Please try again.'
      )
    }
  },

  async checkToken(token, cookies) {
    try {
      const response = await httpClient
        .get(`reset-password/${token}/validate`, {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<CheckTokenResult>()
      return response
    } catch (error) {
      return getError(
        error,
        'Link is invalid. Please try again, or request a new link.'
      )
    }
  },

  async verifyEmail(args) {
    try {
      const response = await httpClient
        .post(`verify-email/${args.token}`, {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(
        error,
        'We could not verify your email. Please try again.'
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
      return getError(error, 'Unable to retrive user information.')
    }
  },

  async createWallet(args) {
    try {
      const response = await httpClient
        .post('wallet', {
          json: {
            ...args,
            country: args.country.value
          }
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<CreateWalletArgs>(
        error,
        'Something went wrong while trying to create your wallet. Please try again.'
      )
    }
  },

  async verifyIdentity(args) {
    try {
      const response = await httpClient
        .post('verify', {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<VerifyIdentityArgs>(
        error,
        'Something went wrong while verifying your ID. Please try again.'
      )
    }
  },

  async updateProfile(args) {
    try {
      const response = await httpClient
        .post('updateProfile', {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<ProfileArgs>(
        error,
        'Something went wrong while updating your profile. Please try again.'
      )
    }
  },

  async getDocuments(cookies) {
    try {
      const response = await httpClient
        .get('documents', {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<SuccessResponse<Document[]>>()
      return response?.result ?? []
    } catch (error) {
      return []
    }
  },

  async getCountries(cookies) {
    try {
      const response = await httpClient
        .get('countries', {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<SuccessResponse<SelectOption[]>>()
      return response?.result ?? []
    } catch (error) {
      return []
    }
  },

  async changePassword(args) {
    try {
      const response = await httpClient
        .patch('change-password', {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<ChangePasswordArgs>(
        error,
        'Something went wrong while changing your password. Please try again.'
      )
    }
  }
})

const userService = createUserService()
export { userService }
