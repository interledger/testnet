import { getError } from '../httpClient'
import { z } from 'zod'
import {
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'
import { WalletAddressResponse, WalletAddressOP } from '@wallet/shared'

export const createWalletAddressSchema = z.object({
  walletAddressName: z.string().toLowerCase().min(3, {
    message:
      'The name of the payment pointer should be at least 3 characters long'
  }),
  publicName: z.string().min(3, {
    message:
      'The public name of the payment pointer should be at least 3 characters long'
  })
})

export const updateWalletAddressSchema = z.object({
  publicName: z.string().min(3, {
    message:
      'The public name of the payment pointer should be at least 3 characters long'
  })
})

export const generateKeysSchema = z.object({
  nickname: z.string().min(3, {
    message: 'The nickname should be at least 3 characters long'
  })
})

export const uploadKeySchema = z.object({
  jwk: z.string(),
  nickname: z.string()
})

type WalletAddressKeyDetails = {
  privateKey: string
  publicKey: string
  keyId: string
}

export type BaseWalletAddressArgs = {
  accountId: string
  walletAddressId: string
}

type GetWalletAddressArgs = { accountId: string; walletAddressId: string }
type GetWalletAddressResult = SuccessResponse<WalletAddressResponse>
type GetWalletAddressResponse = GetWalletAddressResult | ErrorResponse

type ListWalletAddressResult = SuccessResponse<WalletAddressResponse[]>
type ListWalletAddressResponse = ListWalletAddressResult | ErrorResponse

type ListAllWalletAddressResult = SuccessResponse<WalletAddressResponse[]>
type ListAllWalletAddressResponse = ListAllWalletAddressResult | ErrorResponse

type CreateWalletAddressArgs = z.infer<typeof createWalletAddressSchema>
type CreateWalletAddressResult = SuccessResponse<WalletAddressResponse>
type CreateWalletAddressError = ErrorResponse<
  CreateWalletAddressArgs | undefined
>
type CreateWalletAddressResponse =
  | CreateWalletAddressResult
  | CreateWalletAddressError

type UpdateWalletAddressArgs = z.infer<typeof updateWalletAddressSchema> &
  BaseWalletAddressArgs
type UpdateWalletAddressError = ErrorResponse<
  z.infer<typeof updateWalletAddressSchema> | undefined
>
type UpdateWalletAddressResponse = SuccessResponse | UpdateWalletAddressError

type DeleteWalletAddressResponse = SuccessResponse | ErrorResponse

type GenerateKeyArgs = z.infer<typeof generateKeysSchema> &
  BaseWalletAddressArgs
type GenerateKeyResult = SuccessResponse<WalletAddressKeyDetails>
type GenerateKeyResponse = GenerateKeyResult | ErrorResponse

type UploadKeyArgs = z.infer<typeof uploadKeySchema> & BaseWalletAddressArgs
type UploadKeyError = ErrorResponse<
  z.infer<typeof generateKeysSchema> | undefined
>
type UploadKeyResponse = SuccessResponse | UploadKeyError

type RevokeKeyArgs = { keyId: string } & BaseWalletAddressArgs
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
  uploadKey: (args: UploadKeyArgs) => Promise<UploadKeyResponse>
  revokeKey: (args: RevokeKeyArgs) => Promise<RevokeKeyResponse>
  revokeKeys: (args: RevokeKeyArgs[]) => Promise<RevokeKeyResponse>
  getExternal: (url: string) => Promise<AssetCodeResponse>
}

const createWalletAddressService = (): WalletAddressService => ({
  async get(args, cookies) {
    try {
      const response = await httpClient
        .get(
          `accounts/${args.accountId}/wallet-addresses/${args.walletAddressId}/keys`,
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
          `accounts/${args.accountId}/wallet-addresses/${args.walletAddressId}/register-key`,
          {
            json: {
              nickname: args.nickname
            }
          }
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

  async uploadKey(args) {
    try {
      const response = await httpClient
        .post(
          `accounts/${args.accountId}/wallet-addresses/${args.walletAddressId}/upload-key`,
          {
            json: {
              base64Key: args.jwk,
              nickname: args.nickname
            }
          }
        )
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(
        error,
        'We were not able to upload the provided JWK for the payment pointer. Please try again.'
      )
    }
  },

  async revokeKey(args) {
    try {
      const response = await httpClient
        .patch(
          `accounts/${args.accountId}/wallet-addresses/${args.walletAddressId}/${args.keyId}/revoke-key`
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

  async revokeKeys(args) {
    try {
      const response = await httpClient
        .post(`revoke-keys`, {
          json: {
            keys: args
          }
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(
        error,
        'We were not able to revoke the developer keys. Please try again.'
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
