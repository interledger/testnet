import { Env } from '@/config/env'
import { BadRequest, NotFound } from '@/errors'
import { GraphQLClient } from 'graphql-request'
import { v4 as uuid } from 'uuid'
import { Logger } from 'winston'
import {
  Asset,
  CreateAssetMutation,
  CreateAssetMutationVariables,
  CreateIncomingPaymentInput,
  CreateIncomingPaymentMutation,
  CreateIncomingPaymentMutationVariables,
  CreateOutgoingPaymentInput,
  CreateOutgoingPaymentMutation,
  CreateOutgoingPaymentMutationVariables,
  CreatePaymentPointerKeyMutation,
  CreatePaymentPointerKeyMutationVariables,
  CreatePaymentPointerMutation,
  CreatePaymentPointerMutationVariables,
  CreateQuoteInput,
  CreateQuoteMutation,
  CreateQuoteMutationVariables,
  CreateReceiverInput,
  CreateReceiverMutation,
  CreateReceiverMutationVariables,
  DepositLiquidityMutation,
  DepositLiquidityMutationVariables,
  GetAssetQuery,
  GetAssetQueryVariables,
  GetAssetsQuery,
  GetAssetsQueryVariables,
  GetQuoteQuery,
  GetQuoteQueryVariables,
  IncomingPayment,
  JwkInput,
  OutgoingPayment,
  QueryAssetsArgs,
  Quote,
  Receiver,
  RevokePaymentPointerKeyMutation,
  RevokePaymentPointerKeyMutationVariables,
  UpdatePaymentPointerInput,
  UpdatePaymentPointerMutation,
  UpdatePaymentPointerMutationVariables,
  WithdrawLiquidityMutation,
  WithdrawLiquidityMutationVariables
} from './backend/generated/graphql'
import {
  createAssetMutation,
  getAssetQuery,
  getAssetsQuery
} from './backend/request/asset.request'
import { createIncomingPaymentMutation } from './backend/request/incoming-payment.request'
import {
  depositLiquidityMutation,
  withdrawLiquidityMutation
} from './backend/request/liquidity.request'
import { createOutgoingPaymentMutation } from './backend/request/outgoing-payment.request'
import {
  createPaymentPointerKeyMutation,
  revokePaymentPointerKeyMutation
} from './backend/request/payment-pointer-key.request'
import {
  createPaymentPointerMutation,
  updatePaymentPointerMutation
} from './backend/request/payment-pointer.request'
import {
  createQuoteMutation,
  getQuoteQuery
} from './backend/request/quote.request'
import { createReceiverMutation } from '@/rafiki/backend/request/receiver.request'

interface IRafikiClient {
  createAsset(code: string, scale: number): Promise<Asset>
  listAssets(args?: QueryAssetsArgs): Promise<Asset[]>
  getAssetById(id: string): Promise<Asset>
}

interface RafikiClientDependencies {
  logger: Logger
  env: Env
  gqlClient: GraphQLClient
}

type PaymentParams = {
  amount: bigint | null
  asset: Pick<Asset, 'code' | 'scale'>
  description?: string
  expiresAt?: Date
}

export type CreateIncomingPaymentParams = {
  paymentPointerId: string
  accountId: string
} & PaymentParams

export type CreateReceiverParams = {
  paymentPointerUrl: string
} & PaymentParams
export class RafikiClient implements IRafikiClient {
  constructor(private deps: RafikiClientDependencies) {}

  public async createAsset(code: string, scale: number) {
    const response = await this.deps.gqlClient.request<
      CreateAssetMutation,
      CreateAssetMutationVariables
    >(createAssetMutation, { input: { code, scale } })
    if (!response.createAsset.success || !response.createAsset.asset) {
      throw new Error('Data was empty')
    }

    return response.createAsset.asset as Asset
  }

  public async listAssets(args?: QueryAssetsArgs) {
    const response = await this.deps.gqlClient.request<
      GetAssetsQuery,
      GetAssetsQueryVariables
    >(getAssetsQuery, args ?? {})

    return response.assets.edges.map((el: { node: Asset }) => el.node)
  }

  public async getAssetById(id: string): Promise<Asset> {
    const response = await this.deps.gqlClient.request<
      GetAssetQuery,
      GetAssetQueryVariables
    >(getAssetQuery, { id })

    return response.asset as Asset
  }

  public async createIncomingPayment(
    params: CreateIncomingPaymentParams
  ): Promise<IncomingPayment> {
    const input: CreateIncomingPaymentInput = {
      paymentPointerId: params.paymentPointerId,
      metadata: {
        description: params.description
      },
      expiresAt: params.expiresAt?.toISOString(),
      ...(params.amount && {
        incomingAmount: {
          value: params.amount,
          assetCode: params.asset.code,
          assetScale: params.asset.scale
        }
      })
    }
    const { createIncomingPayment: paymentResponse } =
      await this.deps.gqlClient.request<
        CreateIncomingPaymentMutation,
        CreateIncomingPaymentMutationVariables
      >(createIncomingPaymentMutation, {
        input
      })

    if (!paymentResponse.success) {
      throw new Error(paymentResponse.message ?? 'Empty result')
    }
    if (!paymentResponse.payment) {
      throw new Error('Unable to fetch created payment pointer')
    }

    return paymentResponse.payment
  }

  public async createReceiver(params: CreateReceiverParams): Promise<Receiver> {
    const input: CreateReceiverInput = {
      paymentPointerUrl: params.paymentPointerUrl,
      metadata: {
        description: params.description
      },
      expiresAt: params.expiresAt?.toISOString(),
      ...(params.amount && {
        incomingAmount: {
          value: params.amount,
          assetCode: params.asset.code,
          assetScale: params.asset.scale
        }
      })
    }
    const { createReceiver: paymentResponse } =
      await this.deps.gqlClient.request<
        CreateReceiverMutation,
        CreateReceiverMutationVariables
      >(createReceiverMutation, {
        input
      })

    if (!paymentResponse.success) {
      throw new Error(paymentResponse.message ?? 'Empty result')
    }
    if (!paymentResponse.receiver) {
      throw new Error('Unable to fetch created payment pointer')
    }

    return paymentResponse.receiver as Receiver
  }

  public async withdrawLiqudity(eventId: string) {
    const response = await this.deps.gqlClient.request<
      WithdrawLiquidityMutation,
      WithdrawLiquidityMutationVariables
    >(withdrawLiquidityMutation, {
      eventId,
      idempotencyKey: uuid()
    })

    if (!response.withdrawEventLiquidity?.success) {
      if (response.withdrawEventLiquidity?.message === 'Transfer exists') {
        return true
      }
      throw new BadRequest(
        response.withdrawEventLiquidity?.message ||
          'Unable to withdrawLiquidity from rafiki'
      )
    }

    return true
  }

  public async depositLiquidity(eventId: string) {
    const response = await this.deps.gqlClient.request<
      DepositLiquidityMutation,
      DepositLiquidityMutationVariables
    >(depositLiquidityMutation, {
      eventId,
      idempotencyKey: uuid()
    })

    if (!response.depositEventLiquidity?.success) {
      throw new BadRequest(
        response.depositEventLiquidity?.message || 'Unable to deposit to rafiki'
      )
    }

    return true
  }

  public async createOutgoingPayment(
    input: CreateOutgoingPaymentInput
  ): Promise<OutgoingPayment> {
    const { createOutgoingPayment: paymentResponse } =
      await this.deps.gqlClient.request<
        CreateOutgoingPaymentMutation,
        CreateOutgoingPaymentMutationVariables
      >(createOutgoingPaymentMutation, {
        input
      })

    if (!paymentResponse.success) {
      throw new Error(paymentResponse.message ?? 'Empty result')
    }
    if (!paymentResponse.payment) {
      throw new Error('Unable to fetch created payment pointer')
    }

    return paymentResponse.payment
  }

  public async createRafikiPaymentPointer(
    publicName: string,
    assetId: string,
    url: string
  ) {
    const response = await this.deps.gqlClient.request<
      CreatePaymentPointerMutation,
      CreatePaymentPointerMutationVariables
    >(createPaymentPointerMutation, {
      input: {
        assetId,
        publicName,
        url
      }
    })

    if (!response.createPaymentPointer.success) {
      throw new Error(response.createPaymentPointer.message)
    }
    if (!response.createPaymentPointer.paymentPointer) {
      throw new Error('Unable to fetch created payment pointer')
    }

    return response.createPaymentPointer.paymentPointer
  }

  public async updatePaymentPointer(
    args: UpdatePaymentPointerInput
  ): Promise<void> {
    const response = await this.deps.gqlClient.request<
      UpdatePaymentPointerMutation,
      UpdatePaymentPointerMutationVariables
    >(updatePaymentPointerMutation, {
      input: args
    })

    if (!response.updatePaymentPointer.success) {
      throw new Error(response.updatePaymentPointer.message)
    }
  }

  public async createRafikiPaymentPointerKey(
    jwk: JwkInput,
    paymentPointerId: string
  ) {
    const response = await this.deps.gqlClient.request<
      CreatePaymentPointerKeyMutation,
      CreatePaymentPointerKeyMutationVariables
    >(createPaymentPointerKeyMutation, {
      input: {
        paymentPointerId,
        jwk
      }
    })

    if (!response.createPaymentPointerKey?.success) {
      throw new Error(response.createPaymentPointerKey?.message)
    }
    if (!response.createPaymentPointerKey.paymentPointerKey) {
      throw new Error('Unable to fetch created payment pointer key')
    }

    return response.createPaymentPointerKey.paymentPointerKey
  }

  public async revokePaymentPointerKey(id: string): Promise<void> {
    const response = await this.deps.gqlClient.request<
      RevokePaymentPointerKeyMutation,
      RevokePaymentPointerKeyMutationVariables
    >(revokePaymentPointerKeyMutation, {
      input: { id }
    })

    if (!response.revokePaymentPointerKey?.success) {
      throw new Error(response.revokePaymentPointerKey?.message)
    }
  }

  public async createQuote(input: CreateQuoteInput): Promise<Quote> {
    const { createQuote } = await this.deps.gqlClient.request<
      CreateQuoteMutation,
      CreateQuoteMutationVariables
    >(createQuoteMutation, {
      input
    })

    if (
      createQuote.code === '400' &&
      createQuote.message === 'invalid amount'
    ) {
      throw new BadRequest('Fees exceed send amount')
    }

    if (!createQuote.quote) {
      throw new Error('Unable to fetch created quote')
    }

    return createQuote.quote
  }

  public async getQuote(quoteId: string) {
    const getQuote = await this.deps.gqlClient.request<
      GetQuoteQuery,
      GetQuoteQueryVariables
    >(getQuoteQuery, { quoteId })

    if (!getQuote.quote) {
      throw new NotFound(`Quote not found`)
    }

    return getQuote.quote
  }
}
