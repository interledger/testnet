import { GraphQLClient } from 'graphql-request'
import { v4 as uuid } from 'uuid'
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
  CreateWalletAddressKeyMutation,
  CreateWalletAddressKeyMutationVariables,
  CreateWalletAddressMutation,
  CreateWalletAddressMutationVariables,
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
  RevokeWalletAddressKeyMutation,
  RevokeWalletAddressKeyMutationVariables,
  UpdateWalletAddressInput,
  UpdateWalletAddressMutation,
  UpdateWalletAddressMutationVariables,
  WithdrawLiquidityMutation,
  WithdrawLiquidityMutationVariables,
  GetReceiverQuery,
  GetReceiverQueryVariables,
  QueryOutgoingPaymentsArgs,
  GetOutgoingPaymentsQuery,
  GetOutgoingPaymentsQueryVariables,
  GetOutgoingPaymentQuery,
  GetOutgoingPaymentQueryVariables,
  GetIncomingPaymentQuery,
  GetIncomingPaymentQueryVariables
} from './backend/generated/graphql'
import {
  createAssetMutation,
  getAssetQuery,
  getAssetsQuery
} from './backend/request/asset.request'
import {
  createIncomingPaymentMutation,
  getIncomingPaymentQuery
} from './backend/request/incoming-payment.request'
import {
  depositLiquidityMutation,
  withdrawLiquidityMutation
} from './backend/request/liquidity.request'
import {
  createOutgoingPaymentMutation,
  getOutgoingPaymentQuery,
  getOutgoingPayments,
  OutgoingPaymentsGqlResponse
} from './backend/request/outgoing-payment.request'
import {
  createWalletAddressKeyMutation,
  revokeWalletAddressKeyMutation
} from './backend/request/wallet-address-key.request'
import {
  createWalletAddressMutation,
  updateWalletAddressMutation
} from './backend/request/wallet-address.request'
import {
  createQuoteMutation,
  getQuoteQuery
} from './backend/request/quote.request'
import {
  createReceiverMutation,
  getReceiverQuery
} from '@/rafiki/backend/request/receiver.request'
import { BadRequest, NotFound } from '@shared/backend'
import { replaceIlpDev } from '@/utils/helpers'

interface IRafikiClient {
  createAsset(code: string, scale: number): Promise<Asset>
  listAssets(args?: QueryAssetsArgs): Promise<Asset[]>
  getAssetById(id: string): Promise<Asset>
  getRafikiAsset(assetCode: string): Promise<Asset | undefined>
}

type PaymentParams = {
  amount: bigint | null
  asset: Pick<Asset, 'code' | 'scale'>
  description?: string
  expiresAt?: Date
}

export type CreateIncomingPaymentParams = {
  walletAddressId: string
  accountId: string
} & PaymentParams

export type CreateReceiverParams = {
  walletAddressUrl: string
  vopNonce?: string
} & PaymentParams
export class RafikiClient implements IRafikiClient {
  constructor(private backendGraphQLClient: GraphQLClient) {}

  public async createAsset(code: string, scale: number) {
    const response = await this.backendGraphQLClient.request<
      CreateAssetMutation,
      CreateAssetMutationVariables
    >(createAssetMutation, { input: { code, scale } })
    if (!response.createAsset || !response.createAsset.asset) {
      throw new Error('Data was empty')
    }

    return response.createAsset.asset as Asset
  }

  public async listAssets(args?: QueryAssetsArgs) {
    const response = await this.backendGraphQLClient.request<
      GetAssetsQuery,
      GetAssetsQueryVariables
    >(getAssetsQuery, args ?? {})

    return response.assets.edges.map((el) => el.node as Asset)
  }

  public async getAssetById(id: string): Promise<Asset> {
    const response = await this.backendGraphQLClient.request<
      GetAssetQuery,
      GetAssetQueryVariables
    >(getAssetQuery, { id })

    return response.asset as Asset
  }

  public async createIncomingPayment(
    params: CreateIncomingPaymentParams
  ): Promise<IncomingPayment> {
    const input: CreateIncomingPaymentInput = {
      walletAddressId: params.walletAddressId,
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
      await this.backendGraphQLClient.request<
        CreateIncomingPaymentMutation,
        CreateIncomingPaymentMutationVariables
      >(createIncomingPaymentMutation, {
        input
      })

    if (!paymentResponse) {
      throw new Error('Empty result')
    }
    if (!paymentResponse.payment) {
      throw new Error('Unable to fetch created incoming payment')
    }

    return paymentResponse.payment
  }

  public async createReceiver(params: CreateReceiverParams): Promise<Receiver> {
    const walletAddressUrl = replaceIlpDev(params.walletAddressUrl)
    const input: CreateReceiverInput = {
      walletAddressUrl,
      metadata: {
        description: params.description,
        vopNonce: params.vopNonce
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
      await this.backendGraphQLClient.request<
        CreateReceiverMutation,
        CreateReceiverMutationVariables
      >(createReceiverMutation, {
        input
      })

    if (!paymentResponse) {
      throw new Error('Empty result')
    }
    if (!paymentResponse.receiver) {
      throw new Error('Unable to fetch created receiver')
    }

    return paymentResponse.receiver as Receiver
  }

  public async getReceiverById(id: string): Promise<Receiver> {
    const response = await this.backendGraphQLClient.request<
      GetReceiverQuery,
      GetReceiverQueryVariables
    >(getReceiverQuery, { id })

    return response.receiver as Receiver
  }

  public async withdrawLiqudity(eventId: string) {
    const response = await this.backendGraphQLClient.request<
      WithdrawLiquidityMutation,
      WithdrawLiquidityMutationVariables
    >(withdrawLiquidityMutation, {
      eventId,
      idempotencyKey: uuid()
    })

    if (!response.withdrawEventLiquidity?.success) {
      // if (response.withdrawEventLiquidity?.message === 'Transfer exists') {
      //   return true
      // }
      //
      // if (response.withdrawEventLiquidity?.message === 'Invalid id') {
      //   this.logger.debug(`Nothing to withdraw for event ${eventId}`)
      //   return true
      // }
      throw new BadRequest('Unable to withdrawLiquidity from rafiki')
    }

    return true
  }

  public async depositLiquidity(eventId: string) {
    const response = await this.backendGraphQLClient.request<
      DepositLiquidityMutation,
      DepositLiquidityMutationVariables
    >(depositLiquidityMutation, {
      eventId,
      idempotencyKey: uuid()
    })

    if (!response.depositEventLiquidity?.success) {
      throw new BadRequest('Unable to deposit to rafiki')
    }

    return true
  }

  public async createOutgoingPayment(
    input: CreateOutgoingPaymentInput
  ): Promise<OutgoingPayment> {
    const { createOutgoingPayment: paymentResponse } =
      await this.backendGraphQLClient.request<
        CreateOutgoingPaymentMutation,
        CreateOutgoingPaymentMutationVariables
      >(createOutgoingPaymentMutation, {
        input
      })

    if (!paymentResponse) {
      throw new Error('Empty result')
    }
    if (!paymentResponse.payment) {
      throw new Error('Unable to fetch created outgoing payment')
    }

    return paymentResponse.payment as OutgoingPayment
  }

  public async createRafikiWalletAddress(
    publicName: string,
    assetId: string,
    url: string
  ) {
    const response = await this.backendGraphQLClient.request<
      CreateWalletAddressMutation,
      CreateWalletAddressMutationVariables
    >(createWalletAddressMutation, {
      input: {
        assetId,
        publicName,
        address: url
      }
    })

    if (!response.createWalletAddress) {
      throw new Error('Empty result')
    }
    if (!response.createWalletAddress.walletAddress) {
      throw new Error('Unable to fetch created wallet address')
    }

    return response.createWalletAddress.walletAddress
  }

  public async updateWalletAddress(
    args: UpdateWalletAddressInput
  ): Promise<void> {
    const response = await this.backendGraphQLClient.request<
      UpdateWalletAddressMutation,
      UpdateWalletAddressMutationVariables
    >(updateWalletAddressMutation, {
      input: args
    })

    if (!response.updateWalletAddress) {
      throw new Error('Empty result')
    }
  }

  public async createRafikiWalletAddressKey(
    jwk: JwkInput,
    walletAddressId: string
  ) {
    const response = await this.backendGraphQLClient.request<
      CreateWalletAddressKeyMutation,
      CreateWalletAddressKeyMutationVariables
    >(createWalletAddressKeyMutation, {
      input: {
        walletAddressId,
        jwk
      }
    })

    if (!response.createWalletAddressKey) {
      throw new Error('Empty result')
    }
    if (!response.createWalletAddressKey.walletAddressKey) {
      throw new Error('Unable to fetch created wallet address key')
    }

    return response.createWalletAddressKey.walletAddressKey
  }

  public async revokeWalletAddressKey(id: string): Promise<void> {
    const response = await this.backendGraphQLClient.request<
      RevokeWalletAddressKeyMutation,
      RevokeWalletAddressKeyMutationVariables
    >(revokeWalletAddressKeyMutation, {
      input: { id }
    })

    if (!response.revokeWalletAddressKey) {
      throw new Error('Empty result')
    }
  }

  public async createQuote(input: CreateQuoteInput): Promise<Quote> {
    const { createQuote } = await this.backendGraphQLClient.request<
      CreateQuoteMutation,
      CreateQuoteMutationVariables
    >(createQuoteMutation, {
      input
    })

    // if (
    //   createQuote.code === '400' &&
    //   createQuote.message === 'invalid amount'
    // ) {
    //   throw new BadRequest('Fees exceed send amount')
    // }

    if (!createQuote.quote) {
      throw new Error('Unable to create Quote')
    }

    return createQuote.quote as Quote
  }

  public async getQuote(quoteId: string) {
    const getQuote = await this.backendGraphQLClient.request<
      GetQuoteQuery,
      GetQuoteQueryVariables
    >(getQuoteQuery, { quoteId })

    if (!getQuote.quote) {
      throw new NotFound(`Quote not found`)
    }

    return getQuote.quote
  }

  public async getRafikiAsset(assetCode: string, assetScale?: number) {
    const assets = await this.listAssets({ first: 100 })

    const assetInRafiki = assets.find((asset) => {
      if (!assetScale) {
        return asset.code === assetCode
      }
      return asset.code === assetCode && asset.scale === assetScale
    })

    return assetInRafiki
  }

  public async getOutgoingPaymentsByReceiver(receiver: string) {
    return this.listOutgoingPayments({
      filter: { receiver: { in: [receiver] } }
    })
  }

  public async listOutgoingPayments(args: QueryOutgoingPaymentsArgs) {
    const response = await this.backendGraphQLClient.request<
      GetOutgoingPaymentsQuery,
      GetOutgoingPaymentsQueryVariables
    >(getOutgoingPayments, args ?? {})

    return response.outgoingPayments.edges.map(
      (el: { node: OutgoingPaymentsGqlResponse }) => el.node
    )
  }

  public async getOutgoingPaymentById(
    id: string
  ): Promise<OutgoingPaymentsGqlResponse> {
    const response = await this.backendGraphQLClient.request<
      GetOutgoingPaymentQuery,
      GetOutgoingPaymentQueryVariables
    >(getOutgoingPaymentQuery, { id })

    return response.outgoingPayment as OutgoingPaymentsGqlResponse
  }

  public async getIncomingPaymentById(id: string): Promise<IncomingPayment> {
    const response = await this.backendGraphQLClient.request<
      GetIncomingPaymentQuery,
      GetIncomingPaymentQueryVariables
    >(getIncomingPaymentQuery, { id })

    return response.incomingPayment as IncomingPayment
  }
}
