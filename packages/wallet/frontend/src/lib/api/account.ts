import { z } from 'zod'
import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'
import { WalletAddress } from './walletAddress'
import {
  createAccountSchema,
  fundAccountSchema,
} from '@wallet/shared'

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

interface AccountService {
  get: (accountId: string, cookies?: string) => Promise<GetAccountResponse>
  list: (
    cookies?: string,
    include?: ('walletAddresses' | 'walletAddressKeys')[]
  ) => Promise<ListAccountsResponse>
  create: (args: CreateAccountArgs) => Promise<CreateAccountResponse>
  fund: (args: FundAccountArgs) => Promise<FundAccountResponse>
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
  }
})

const accountService = createAccountService()
export { accountService }
