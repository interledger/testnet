import { z } from 'zod'
import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'
import { acceptQuoteSchema, Quote } from './transfers'
import { WalletAddress } from './walletAddress'

export const fundAccountSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.coerce
    .number({
      invalid_type_error: 'Please enter a valid amount'
    })
    .positive({ message: 'Please enter an amount' })
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

export const exchangeAssetSchema = z.object({
  amount: z.coerce
    .number({
      invalid_type_error: 'Please enter a valid amount'
    })
    .positive({ message: 'Please enter an amount' }),
  asset: z.object({
    value: z
      .string({
        required_error: 'Please select an asset you want to exchange to'
      })
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
  walletAddresses: WalletAddress[]
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

type ExchangeArgs = z.infer<typeof exchangeAssetSchema>
type QuoteResult = SuccessResponse<Quote>
type ExchangeResponse = QuoteResult | ErrorResponse<ExchangeArgs | undefined>

type AcceptQuoteArgs = z.infer<typeof acceptQuoteSchema>
type AcceptQuoteError = ErrorResponse<AcceptQuoteArgs | undefined>
type AcceptQuoteResponse = SuccessResponse | AcceptQuoteError

interface AccountService {
  get: (accountId: string, cookies?: string) => Promise<GetAccountResponse>
  list: (
    cookies?: string,
    include?: 'walletAddresses'
  ) => Promise<ListAccountsResponse>
  create: (args: CreateAccountArgs) => Promise<CreateAccountResponse>
  fund: (args: FundAccountArgs) => Promise<FundAccountResponse>
  withdraw: (args: WithdrawFundsArgs) => Promise<WithdrawFundsResponse>
  exchange: (accountId: string, args: ExchangeArgs) => Promise<ExchangeResponse>
  acceptExchangeQuote: (args: AcceptQuoteArgs) => Promise<AcceptQuoteResponse>
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

  async list(cookies, include) {
    try {
      const response = await httpClient
        .get(`accounts${include ? `?include=${include}` : ``}`, {
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
  },

  async exchange(accountId, args) {
    try {
      const response = await httpClient
        .post(`accounts/${accountId}/exchange`, {
          json: {
            assetCode: args.asset.label,
            amount: args.amount
          }
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<ExchangeArgs>(
        error,
        'We were not able to exchange your money to the selected currency. Please try again.'
      )
    }
  },

  async acceptExchangeQuote(args) {
    try {
      const response = await httpClient
        .post('outgoing-payments', {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<AcceptQuoteArgs>(
        error,
        'We could not send the money. Please try again.'
      )
    }
  }
})

const accountService = createAccountService()
export { accountService }
