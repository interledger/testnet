import { getError } from '../httpClient'
import { z } from 'zod'
import {
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'
import { AssetOP } from './asset'

export const createPaymentPointerSchema = z.object({
  paymentPointerName: z.string().toLowerCase().min(3, {
    message:
      'The name of the payment pointer should be at least 3 characters long'
  }),
  publicName: z.string().min(3, {
    message:
      'The public name of the payment pointer should be at least 3 characters long'
  }),
  isWM: z.boolean()
})

export const updatePaymentPointerSchema = z.object({
  publicName: z.string().min(3, {
    message:
      'The public name of the payment pointer should be at least 3 characters long'
  })
})

type PaymentPointerKey = {
  id: string
  publicKey: string
  createdOn: string
}

export type PaymentPointer = {
  id: string
  url: string
  publicName: string
  accountId: string
  keyIds: PaymentPointerKey | null
}


export type ListPaymentPointersResult = {
  wmPaymentPointers: Array<PaymentPointer>
  paymentPointers: Array<PaymentPointer>
}

type PaymentPointerKeyDetails = {
  privateKey: string
  publicKey: string
  keyId: string
}

type BasePaymentPointerArgs = {
  accountId: string
  paymentPointerId: string
}

type PaymentPointerOP = AssetOP & {
  id: string
  publicName: string
  authServer: string
}

type GetPaymentPointerArgs = { accountId: string; paymentPointerId: string }
type GetPaymentPointerResult = SuccessResponse<PaymentPointer>
type GetPaymentPointerResponse = GetPaymentPointerResult | ErrorResponse

type ListPaymentPointerResult = SuccessResponse<ListPaymentPointersResult>
type ListPaymentPointerResponse = ListPaymentPointerResult | ErrorResponse

type CreatePaymentPointerArgs = z.infer<typeof createPaymentPointerSchema>
type CreatePaymentPointerResult = SuccessResponse<PaymentPointer>
type CreatePaymentPointerError = ErrorResponse<
  CreatePaymentPointerArgs | undefined
>
type CreatePaymentPointerResponse =
  | CreatePaymentPointerResult
  | CreatePaymentPointerError

type UpdatePaymentPointerArgs = z.infer<typeof updatePaymentPointerSchema> & {
  accountId: string
  paymentPointerId: string
}
type UpdatePaymentPointerError = ErrorResponse<
  z.infer<typeof updatePaymentPointerSchema> | undefined
>
type UpdatePaymentPointerResponse = SuccessResponse | UpdatePaymentPointerError

type DeletePaymentPointerResponse = SuccessResponse | ErrorResponse

type GenerateKeyArgs = BasePaymentPointerArgs
type GenerateKeyResult = SuccessResponse<PaymentPointerKeyDetails>
type GenerateKeyResponse = GenerateKeyResult | ErrorResponse

type RevokeKeyArgs = BasePaymentPointerArgs
type RevokeKeyResponse = SuccessResponse | ErrorResponse

type AssetCodeResult = SuccessResponse<PaymentPointerOP>
type AssetCodeResponse = AssetCodeResult | ErrorResponse

interface PaymentPointerService {
  get: (
    args: GetPaymentPointerArgs,
    cookies?: string
  ) => Promise<GetPaymentPointerResponse>
  list: (
    accountId: string,
    cookies?: string
  ) => Promise<ListPaymentPointerResponse>
  listAll: (cookies?: string) => Promise<ListPaymentPointerResponse>
  create: (
    accountId: string,
    args: CreatePaymentPointerArgs
  ) => Promise<CreatePaymentPointerResponse>
  update: (
    args: UpdatePaymentPointerArgs
  ) => Promise<UpdatePaymentPointerResponse>
  delete: (paymentPointerId: string) => Promise<DeletePaymentPointerResponse>
  generateKey: (args: GenerateKeyArgs) => Promise<GenerateKeyResponse>
  revokeKey: (args: RevokeKeyArgs) => Promise<RevokeKeyResponse>
  getExternal: (url: string) => Promise<AssetCodeResponse>
}

const createPaymentPointerService = (): PaymentPointerService => ({
  async get(args, cookies) {
    try {
      const response = await httpClient
        .get(
          `accounts/${args.accountId}/payment-pointers/${args.paymentPointerId}`,
          {
            headers: {
              ...(cookies ? { Cookie: cookies } : {})
            }
          }
        )
        .json<GetPaymentPointerResult>()
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
        .get(`accounts/${accountId}/payment-pointers`, {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<ListPaymentPointerResult>()
      return response
    } catch (error) {
      return getError(error, 'Unable to fetch payment pointers.')
    }
  },

  async listAll(cookies) {
    try {
      const response = await httpClient
        .get('payment-pointers', {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<ListPaymentPointerResult>()
      return response
    } catch (error) {
      return getError(error, 'Unable to fetch payment pointers.')
    }
  },

  async create(accountId, args) {
    try {
      const response = await httpClient
        .post(`accounts/${accountId}/payment-pointers`, {
          json: args
        })
        .json<CreatePaymentPointerResult>()
      return response
    } catch (error) {
      return getError<CreatePaymentPointerArgs>(
        error,
        'We were not able to create your payment pointer. Please try again.'
      )
    }
  },

  async update(args) {
    try {
      const response = await httpClient
        .patch(
          `accounts/${args.accountId}/payment-pointers/${args.paymentPointerId}`,
          {
            json: {
              publicName: args.publicName
            }
          }
        )
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<UpdatePaymentPointerArgs>(
        error,
        'We were not able to update your payment pointer. Please try again.'
      )
    }
  },

  async delete(
    paymentPointerId: string
  ): Promise<DeletePaymentPointerResponse> {
    try {
      const response = await httpClient
        .delete(`payment-pointer/${paymentPointerId}`)
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
          `accounts/${args.accountId}/payment-pointers/${args.paymentPointerId}/register-key`
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
          `accounts/${args.accountId}/payment-pointers/${args.paymentPointerId}/revoke-key`
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
        .get(`external-payment-pointers?url=${url}`)
        .json<AssetCodeResult>()
      return response
    } catch (error) {
      return getError(error, 'Error fetching external payment pointer details.')
    }
  }
})

const paymentPointerService = createPaymentPointerService()
export { paymentPointerService }
