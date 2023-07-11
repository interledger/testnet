import { Logger } from 'winston'
import { Env } from '@/config/env'
import {
  createAssetMutation,
  getAssetQuery,
  getAssetsQuery
} from './backend/request/asset.request'
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
  CreatePaymentPointerMutation,
  CreatePaymentPointerMutationVariables,
  CreatePaymentPointerKeyMutation,
  CreateQuoteInput,
  CreateQuoteMutation,
  CreateQuoteMutationVariables,
  DepositLiquidityMutation,
  DepositLiquidityMutationVariables,
  GetAssetQuery,
  GetAssetQueryVariables,
  GetAssetsQuery,
  GetAssetsQueryVariables,
  GetQuoteQuery,
  GetQuoteQueryVariables,
  IncomingPayment,
  OutgoingPayment,
  Quote,
  WithdrawLiquidityMutation,
  WithdrawLiquidityMutationVariables,
  CreatePaymentPointerKeyMutationVariables,
  JwkInput,
  QueryAssetsArgs
} from './backend/generated/graphql'
import { createIncomingPaymentMutation } from './backend/request/incoming-payment.request'
import { BadRequest, NotFound } from '@/errors'
import {
  depositLiquidityMutation,
  withdrawLiquidityMutation
} from './backend/request/liquidity.request'
import { createOutgoingPaymentMutation } from './backend/request/outgoing-payment.request'
import { createPaymentPointerMutation } from './backend/request/payment-pointer.request'
import { createPaymentPointerKeyMutation } from './backend/request/payment-pointer-key.request'
import { GraphQLClient } from 'graphql-request'
import {
  createQuoteMutation,
  getQuoteQuery
} from './backend/request/quote.request'
import { v4 as uuid } from 'uuid'

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

export type CreateIncomingPaymentParams = {
  paymentPointerId: string
  amount: bigint | null
  asset: Asset
  description?: string
  expiresAt?: string
}

type CreateQuoteParams = {
  paymentPointerId: string
  receiver: string
  asset: Asset
  amount?: bigint
}

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

  public async getAssetById(id: string) {
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
      expiresAt: params.expiresAt,
      ...(params.amount && {
        incomingAmount: {
          value: params.amount as unknown as bigint,
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

  public async withdrawLiqudity(eventId: string) {
    const response = await this.deps.gqlClient.request<
      WithdrawLiquidityMutation,
      WithdrawLiquidityMutationVariables
    >(withdrawLiquidityMutation, {
      eventId,
      idempotencyKey: uuid()
    })

    if (!response.withdrawEventLiquidity?.success) {
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

  public async createQuote(params: CreateQuoteParams): Promise<Quote> {
    const value = {
      value: params.amount as unknown as bigint,
      assetCode: params.asset.code,
      assetScale: params.asset.scale
    }

    const input: CreateQuoteInput = {
      paymentPointerId: params.paymentPointerId,
      receiver: params.receiver
    }

    if (params.amount) {
      input.sendAmount = value
    }

    const { createQuote } = await this.deps.gqlClient.request<
      CreateQuoteMutation,
      CreateQuoteMutationVariables
    >(createQuoteMutation, {
      input
    })

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
