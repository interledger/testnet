import { z } from 'zod'
import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'
import { acceptQuoteSchema } from './transfers'
import {
  createAccountSchema,
  fundAccountSchema,
  withdrawFundsSchema,
  exchangeAssetSchema
} from '@wallet/shared'
import { QuoteResponse } from '@wallet/shared'
import { WalletAddressResponse } from '@wallet/shared'

export type Account = {
  id: string
  name: string
  assetCode: string
  assetScale: number
  assetId: string
  balance: string
  walletAddresses: WalletAddressResponse[]
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
type QuoteResult = SuccessResponse<QuoteResponse>
type ExchangeResponse = QuoteResult | ErrorResponse<ExchangeArgs | undefined>

type AcceptQuoteArgs = z.infer<typeof acceptQuoteSchema>
type AcceptQuoteError = ErrorResponse<AcceptQuoteArgs | undefined>
type AcceptQuoteResponse = SuccessResponse | AcceptQuoteError

interface AccountService {
  get: (accountId: string, cookies?: string) => Promise<GetAccountResponse>
  list: (
    cookies?: string,
    include?: ('walletAddresses' | 'walletAddressKeys')[]
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
      const searchParams = new URLSearchParams()
      include?.forEach((value) => {
        searchParams.append('include[]', value)
      })

      const response = await httpClient
        .get(`accounts`, {
          searchParams,
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
