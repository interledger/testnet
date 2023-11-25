import { getError } from '../httpClient'
import { z } from 'zod'
import {
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'
import { AssetOP } from './asset'

export const createWalletAddressSchema = z.object({
  walletAddressName: z.string().toLowerCase().min(3, {
    message:
      'The name of the payment pointer should be at least 3 characters long'
  }),
  publicName: z.string().min(3, {
    message:
      'The public name of the payment pointer should be at least 3 characters long'
  }),
  isWM: z.boolean()
})

export const updateWalletAddressSchema = z.object({
  publicName: z.string().min(3, {
    message:
      'The public name of the payment pointer should be at least 3 characters long'
  })
})

type WalletAddressKey = {
  id: string
  publicKey: string
  createdOn: string
}

export type WalletAddress = {
  id: string
  url: string
  publicName: string
  accountId: string
  keyIds: WalletAddressKey | null
  incomingBalance: string
  outgoingBalance: string
  assetCode?: string
  assetScale?: number
}

export type ListWalletAddresses = {
  wmWalletAddresses: Array<WalletAddress>
  walletAddresses: Array<WalletAddress>
}

type WalletAddressKeyDetails = {
  privateKey: string
  publicKey: string
  keyId: string
}

type BaseWalletAddressArgs = {
  accountId: string
  walletAddressId: string
}

type WalletAddressOP = AssetOP & {
  id: string
  publicName: string
  authServer: string
}

type GetWalletAddressArgs = { accountId: string; walletAddressId: string }
type GetWalletAddressResult = SuccessResponse<WalletAddress>
type GetWalletAddressResponse = GetWalletAddressResult | ErrorResponse

type ListWalletAddressResult = SuccessResponse<ListWalletAddresses>
type ListWalletAddressResponse = ListWalletAddressResult | ErrorResponse

type ListAllWalletAddressResult = SuccessResponse<WalletAddress[]>
type ListAllWalletAddressResponse = ListAllWalletAddressResult | ErrorResponse

type CreateWalletAddressArgs = z.infer<typeof createWalletAddressSchema>
type CreateWalletAddressResult = SuccessResponse<WalletAddress>
type CreateWalletAddressError = ErrorResponse<
  CreateWalletAddressArgs | undefined
>
type CreateWalletAddressResponse =
  | CreateWalletAddressResult
  | CreateWalletAddressError

type UpdateWalletAddressArgs = z.infer<typeof updateWalletAddressSchema> & {
  accountId: string
  walletAddressId: string
}
type UpdateWalletAddressError = ErrorResponse<
  z.infer<typeof updateWalletAddressSchema> | undefined
>
type UpdateWalletAddressResponse = SuccessResponse | UpdateWalletAddressError

type DeleteWalletAddressResponse = SuccessResponse | ErrorResponse

type GenerateKeyArgs = BaseWalletAddressArgs
type GenerateKeyResult = SuccessResponse<WalletAddressKeyDetails>
type GenerateKeyResponse = GenerateKeyResult | ErrorResponse

type RevokeKeyArgs = BaseWalletAddressArgs
type RevokeKeyResponse = SuccessResponse | ErrorResponse

type AssetCodeResult = SuccessResponse<WalletAddressOP>
type AssetCodeResponse = AssetCodeResult | ErrorResponse

interface WalletAddressService {
  get: (
    args: GetWalletAddressArgs,
    cookies?: string
  ) => Promise<GetWalletAddressResponse>
  list: (
    accountId: string,
    cookies?: string
  ) => Promise<ListWalletAddressResponse>
  listAll: (cookies?: string) => Promise<ListAllWalletAddressResponse>
  create: (
    accountId: string,
    args: CreateWalletAddressArgs
  ) => Promise<CreateWalletAddressResponse>
  update: (
    args: UpdateWalletAddressArgs
  ) => Promise<UpdateWalletAddressResponse>
  delete: (walletAddressId: string) => Promise<DeleteWalletAddressResponse>
  generateKey: (args: GenerateKeyArgs) => Promise<GenerateKeyResponse>
  revokeKey: (args: RevokeKeyArgs) => Promise<RevokeKeyResponse>
  getExternal: (url: string) => Promise<AssetCodeResponse>
}

const createWalletAddressService = (): WalletAddressService => ({
  async get(args, cookies) {
    try {
      const response = await httpClient
        .get(
          `accounts/${args.accountId}/wallet-addresses/${args.walletAddressId}`,
          {
            headers: {
              ...(cookies ? { Cookie: cookies } : {})
            }
          }
        )
        .json<GetWalletAddressResult>()
      return response
    } catch (error) {
      return getError(
        error,
        'We were not able to fetch information about the payment pointer. Please try again.'
      )
    }
  },

  async list(accountId, cookies) {
    try {
      const response = await httpClient
        .get(`accounts/${accountId}/wallet-addresses`, {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<ListWalletAddressResult>()
      return response
    } catch (error) {
      return getError(error, 'Unable to fetch payment pointers.')
    }
  },

  async listAll(cookies) {
    try {
      const response = await httpClient
        .get('wallet-addresses', {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<ListAllWalletAddressResponse>()
      return response
    } catch (error) {
      return getError(error, 'Unable to fetch payment pointers.')
    }
  },

  async create(accountId, args) {
    try {
      const response = await httpClient
        .post(`accounts/${accountId}/wallet-addresses`, {
          json: args
        })
        .json<CreateWalletAddressResult>()
      return response
    } catch (error) {
      return getError<CreateWalletAddressArgs>(
        error,
        'We were not able to create your payment pointer. Please try again.'
      )
    }
  },

  async update(args) {
    try {
      const response = await httpClient
        .patch(
          `accounts/${args.accountId}/wallet-addresses/${args.walletAddressId}`,
          {
            json: {
              publicName: args.publicName
            }
          }
        )
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<UpdateWalletAddressArgs>(
        error,
        'We were not able to update your payment pointer. Please try again.'
      )
    }
  },

  async delete(walletAddressId: string): Promise<DeleteWalletAddressResponse> {
    try {
      const response = await httpClient
        .delete(`wallet-addresses/${walletAddressId}`)
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(
        error,
        'We were not able to delete your payment pointer. Please try again.'
      )
    }
  },

  async generateKey(args) {
    try {
      const response = await httpClient
        .post(
          `accounts/${args.accountId}/wallet-addresses/${args.walletAddressId}/register-key`
        )
        .json<GenerateKeyResult>()
      return response
    } catch (error) {
      return getError(
        error,
        'We were not able to generate a key for your payment pointer. Please try again.'
      )
    }
  },

  async revokeKey(args) {
    try {
      const response = await httpClient
        .patch(
          `accounts/${args.accountId}/wallet-addresses/${args.walletAddressId}/revoke-key`
        )
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(
        error,
        'We were not able to revoke the key. Please try again.'
      )
    }
  },

  async getExternal(url) {
    try {
      const response = await httpClient
        .get(`external-wallet-addresses?url=${url}`)
        .json<AssetCodeResult>()
      return response
    } catch (error) {
      return getError(error, 'Error fetching external payment pointer details.')
    }
  }
})

const walletAddressService = createWalletAddressService()
export { walletAddressService }
