import { z } from 'zod'
import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'

export const fundAccountSchema = z.object({
  account: z.string().uuid(),
  amount: z.coerce
    .number({
      invalid_type_error: 'Please enter a valid amount'
    })
    .positive()
})

export const createAccountSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Accout name should be at least 3 characters long' }),
  assetRafikiId: z
    .string({ required_error: 'Please select an asset for your account' })
    .uuid()
})

export type Account = {
  id: string
  name: string
  assetCode: string
  balance?: number
}

type GetAccountResult = SuccessResponse<Account>
type GetAccountResponse = GetAccountResult | ErrorResponse

type ListAccountsResult = SuccessResponse<Account[]>
type ListAccountsResponse = Promise<ListAccountsResult | ErrorResponse>

type CreateAccountArgs = z.infer<typeof createAccountSchema>
type CreateAccountResult = SuccessResponse<Account>
type CreateAccountError = ErrorResponse<CreateAccountArgs | undefined>
type CreateAccountResponse = Promise<CreateAccountResult | CreateAccountError>

type FundAccountArgs = z.infer<typeof fundAccountSchema>
type FundAccountError = ErrorResponse<FundAccountArgs | undefined>
type FundAccountResponse = Promise<SuccessResponse | FundAccountError>

interface AccountService {
  get: (accountId: string, cookies?: string) => Promise<GetAccountResponse>
  list: (cookies?: string) => Promise<ListAccountsResponse>
  create: (args: CreateAccountArgs) => Promise<CreateAccountResponse>
  fund: (args: FundAccountArgs) => Promise<FundAccountResponse>
}

const createAccountService = (): AccountService => ({
  async get(accountId, cookies): Promise<GetAccountResponse> {
    try {
      const response = await httpClient
        .get(`accounts/${accountId}`, {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<GetAccountResult>()
      return response
    } catch (error) {
      return getError(error, 'Unable to fetch account details')
    }
  },

  async list(cookies): Promise<ListAccountsResponse> {
    try {
      const response = await httpClient
        .get('accounts', {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<ListAccountsResult>()
      return response
    } catch (error) {
      return getError(error, 'Unable to fetch account list')
    }
  },

  async create(args): Promise<CreateAccountResponse> {
    try {
      const response = await httpClient
        .post('accounts', {
          json: args
        })
        .json<CreateAccountResult>()
      return response
    } catch (error) {
      return getError<CreateAccountArgs>(
        error,
        'We were not able to create your account. Please try again.'
      )
    }
  },

  async fund(args: FundAccountArgs): Promise<FundAccountResponse> {
    try {
      const response = await httpClient
        .post('fund', {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<FundAccountArgs>(
        error,
        'We were not able to fund your account. Please try again.'
      )
    }
  }
})

export const accountService = createAccountService()
