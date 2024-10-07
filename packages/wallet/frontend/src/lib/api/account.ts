import { z } from 'zod'
import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'
import { createAccountSchema } from '@wallet/shared'
import { WalletAddressResponse } from '@wallet/shared/src'
import { depositSchema } from '@/components/dialogs/DepositDialog'

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

type DepositArgs = z.infer<typeof depositSchema>
type DepositResult = SuccessResponse
type DepositError = ErrorResponse<DepositArgs | undefined>
type DepositResponse = DepositResult | DepositError

interface AccountService {
  get: (accountId: string, cookies?: string) => Promise<GetAccountResponse>
  list: (
    cookies?: string,
    include?: ('walletAddresses' | 'walletAddressKeys')[]
  ) => Promise<ListAccountsResponse>
  create: (args: CreateAccountArgs) => Promise<CreateAccountResponse>
  deposit: (args: DepositArgs) => Promise<DepositResponse>
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

  async deposit(args) {
    try {
      const response = await httpClient
        .post(`accounts/${args.accountId}/fund`, {
          json: {
            amount: args.amount
          }
        })
        .json<DepositResult>()
      return response
    } catch (error) {
      return getError<DepositArgs>(
        error,
        'We were not able to fund your account. Please try again.'
      )
    }
  }
})

const accountService = createAccountService()
export { accountService }
