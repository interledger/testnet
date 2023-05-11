/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from 'winston'
import { Env } from '../config/env'
import {
  createAssetMutation,
  getAssetQuery,
  getAssetsQuery
} from './request/asset.request'
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
  CreateQuoteInput,
  CreateQuoteMutation,
  CreateQuoteMutationVariables,
  DepositLiquidityMutation,
  DepositLiquidityMutationVariables,
  GetAssetQuery,
  GetAssetQueryVariables,
  GetAssetsQuery,
  GetAssetsQueryVariables,
  IncomingPayment,
  OutgoingPayment,
  Quote,
  WithdrawLiquidityMutation,
  WithdrawLiquidityMutationVariables
} from './generated/graphql'
import { GraphQLClient } from 'graphql-request'
import { createIncomingPaymentMutation } from './request/incoming-payment.request'
import { BadRequest } from '../errors'
import {
  depositLiquidityMutation,
  withdrawLiquidityMutation
} from './request/liquidity.request'
import { graphqlClient } from '..'
import { createOutgoingPaymentMutation } from './request/outgoing-payment.request'
import { createPaymentPointerMutation } from './request/payment-pointer.request'

interface IRafikiClient {
  createAsset(code: string, scale: number): Promise<any>
  listAssets(): Promise<any>
  getAssetById(id: string): Promise<any>
}

interface RafikiClientDependencies {
  logger: Logger
  env: Env
  gqlClient: GraphQLClient
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

    return response.createAsset.asset
  }

  public async listAssets() {
    const response = await this.deps.gqlClient.request<
      GetAssetsQuery,
      GetAssetsQueryVariables
    >(getAssetsQuery, {})

    return response.assets.edges.map((el: { node: any }) => el.node)
  }

  public async getAssetById(id: string) {
    const response = await this.deps.gqlClient.request<
      GetAssetQuery,
      GetAssetQueryVariables
    >(getAssetQuery, { id })

    return response.asset
  }

  public async createIncomingPayment(
    paymentPointerId: string,
    amount: bigint | null,
    asset: Asset,
    description?: string,
    expiresAt?: string
  ): Promise<IncomingPayment> {
    const input: CreateIncomingPaymentInput = {
      paymentPointerId,
      description,
      expiresAt,
      ...(amount && {
        incomingAmount: {
          value: amount as unknown as bigint,
          assetCode: asset.code,
          assetScale: asset.scale
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
      eventId
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
      eventId
    })

    if (!response.depositEventLiquidity?.success) {
      throw new BadRequest(
        response.depositEventLiquidity?.message || 'Unable to deposit to rafiki'
      )
    }

    return true
  }

  public async createOutgoingPayment(
    paymentPointerId: string,
    quoteId: string,
    description?: string
  ): Promise<OutgoingPayment> {
    const input: CreateOutgoingPaymentInput = {
      paymentPointerId,
      quoteId,
      description
    }
    const { createOutgoingPayment: paymentResponse } =
      await graphqlClient.request<
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
    //! build the url where this is called
    //`${env.OPEN_PAYMENTS_HOST}/${paymentPointerName}`
  ) {
    const response = await graphqlClient.request<
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

  public async createQuote(
    paymentPointerId: string,
    receiver: string,
    asset: Asset,
    amount?: bigint
  ): Promise<Quote> {
    const value = {
      value: amount as unknown as bigint,
      assetCode: asset.code,
      assetScale: asset.scale
    }

    const input: CreateQuoteInput = {
      paymentPointerId,
      receiver
    }

    if (amount) {
      input.sendAmount = value
    }

    const { createQuote } = await graphqlClient.request<
      CreateQuoteMutation,
      CreateQuoteMutationVariables
    >(createIncomingPaymentMutation, {
      input
    })

    if (!createQuote.quote) {
      throw new Error('Unable to fetch created quote')
    }

    return createQuote.quote
  }
}
