import { z } from 'zod'
import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'

export const fundAccountSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.coerce
    .number({
      invalid_type_error: 'Please enter a valid amount'
    })
    .min(1, { message: 'Please enter an amount' })
    .positive()
})

export const withdrawFundsSchema = fundAccountSchema

export const createAccountSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Accout name should be at least 3 characters long' }),
  asset: z.object({
    value: z
      .string({ required_error: 'Please select an asset for your account' })
      .uuid(),
    label: z.string().min(1)
  })
})

export type Account = {
  id: string
  name: string
  assetCode: string
  assetScale: number
  assetId: string
  balance: string
}

type GetAccountResult = SuccessResponse<Account>
type GetAccountResponse = GetAccountResult | ErrorResponse

type ListAccountsResult = SuccessResponse<Account[]>
type ListAccountsResponse = ListAccountsResult | ErrorResponse

type CreateAccountArgs = z.infer<typeof createAccountSchema>
type CreateAccountResult = SuccessResponse<Account>
type CreateAccountError = ErrorResponse<CreateAccountArgs | undefined>
type CreateAccountResponse = CreateAccountResult | CreateAccountError

type FundAccountArgs = z.infer<typeof fundAccountSchema>
type FundAccountError = ErrorResponse<FundAccountArgs | undefined>
type FundAccountResponse = SuccessResponse | FundAccountError

type WithdrawFundsArgs = z.infer<typeof withdrawFundsSchema>
type WithdrawFundsError = ErrorResponse<WithdrawFundsArgs | undefined>
type WithdrawFundsResponse = SuccessResponse | WithdrawFundsError

interface AccountService {
  get: (accountId: string, cookies?: string) => Promise<GetAccountResponse>
  list: (cookies?: string) => Promise<ListAccountsResponse>
  create: (args: CreateAccountArgs) => Promise<CreateAccountResponse>
  fund: (args: FundAccountArgs) => Promise<FundAccountResponse>
  withdraw: (args: WithdrawFundsArgs) => Promise<WithdrawFundsResponse>
}

const createAccountService = (): AccountService => ({
  async get(accountId, cookies) {
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
      return getError(error, 'Unable to fetch account details.')
    }
  },

  async list(cookies) {
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
      return getError(error, 'Unable to fetch account list.')
    }
  },

  async create(args) {
    try {
      const response = await httpClient
        .post('accounts', {
          json: {
            name: args.name,
            assetId: args.asset.value
          }
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

  async fund(args) {
    try {
      const response = await httpClient
        .post('accounts/fund', {
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
  },

  async withdraw(args) {
    try {
      const response = await httpClient
        .post('accounts/withdraw', {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<WithdrawFundsArgs>(
        error,
        'We were not able to withdraw the funds. Please try again.'
      )
    }
  }
})

const accountService = createAccountService()
export { accountService }
