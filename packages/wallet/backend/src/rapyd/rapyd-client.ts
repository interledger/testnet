import { Env } from '@/config/env'
import { User } from '@/user/model'
import axios, { AxiosError } from 'axios'
import crypto from 'crypto-js'
import { Logger } from 'winston'
import { AnyZodObject, ZodEffects, z } from 'zod'
import {
  CompletePayoutRequest,
  CompletePayoutResponse,
  CompletePayoutResponseSchema,
  PayoutMethodResponse,
  RapydAccountBalance,
  RapydCountry,
  RapydDepositRequest,
  RapydDepositResponse,
  RapydDepositResponseSchema,
  RapydDocumentType,
  RapydHoldRequest,
  RapydHoldResponse,
  RapydHoldResponseSchema,
  RapydIdentityRequest,
  RapydIdentityResponse,
  RapydIdentityResponseSchema,
  RapydProfile,
  RapydReleaseRequest,
  RapydReleaseResponse,
  RapydReleaseResponseSchema,
  RapydResponse,
  RapydSetTransferResponse,
  RapydSetTransferResponseRequest,
  RapydSetTransferResponseSchema,
  RapydTransferRequest,
  RapydWallet,
  RapydWalletSchema,
  SimulateBankTransferToWalletRequest,
  SimulateBankTransferToWalletResponse,
  SimulateBankTransferToWalletResponseSchema,
  VirtualAccountRequest,
  VirtualAccountResponse,
  VirtualAccountResponseSchema,
  WithdrawFundsFromAccountResponse,
  WithdrawFundsFromAccountResponseSchema
} from './rapyd'
import { validateRapydResponse } from './validation'

interface IRapydClient {
  createWallet(wallet: RapydWallet): Promise<RapydResponse<RapydWallet>>
  updateProfile(profile: RapydProfile): Promise<RapydResponse<RapydWallet>>
  verifyIdentity(
    req: RapydIdentityRequest
  ): Promise<RapydResponse<RapydIdentityResponse>>
  depositLiquidity(
    req: RapydDepositRequest
  ): Promise<RapydResponse<RapydDepositResponse>>
  holdLiquidity(
    req: RapydHoldRequest
  ): Promise<RapydResponse<RapydHoldResponse>>
  releaseLiquidity(
    req: RapydReleaseRequest
  ): Promise<RapydResponse<RapydReleaseResponse>>
  transferLiquidity(
    req: RapydTransferRequest
  ): Promise<RapydResponse<RapydSetTransferResponse>>
  getAccountsBalance(
    walletId: string
  ): Promise<RapydResponse<RapydAccountBalance[]>>
  getDocumentTypes(country: string): Promise<RapydResponse<RapydDocumentType[]>>
  getCountryNames(): Promise<RapydResponse<RapydCountry[]>>
  issueVirtualAccount(
    req: VirtualAccountRequest
  ): Promise<RapydResponse<VirtualAccountResponse>>
  simulateBankTransferToWallet(
    req: SimulateBankTransferToWalletRequest
  ): Promise<RapydResponse<SimulateBankTransferToWalletResponse>>
  withdrawFundsFromAccount(
    args: WithdrawFundsParams
  ): Promise<RapydResponse<WithdrawFundsFromAccountResponse>>
}

interface RapydClientDependencies {
  logger: Logger
  env: Env
}

type WithdrawFundsParams = {
  assetCode: string
  amount: number
  user: User
}

type CalculateSignatureParams = {
  httpMethod: string
  url: string
  salt: string
  accessKey: string
  secretKey: string
  body: string
}

export class RapydClient implements IRapydClient {
  constructor(private deps: RapydClientDependencies) {}

  public createWallet(
    wallet: RapydWallet
  ): Promise<RapydResponse<RapydWallet>> {
    return this.post('user', JSON.stringify(wallet), RapydWalletSchema)
  }

  public updateProfile(
    profile: RapydProfile
  ): Promise<RapydResponse<RapydWallet>> {
    return this.put('user', JSON.stringify(profile), RapydWalletSchema)
  }

  public verifyIdentity(
    req: RapydIdentityRequest
  ): Promise<RapydResponse<RapydIdentityResponse>> {
    return this.post(
      'identities',
      JSON.stringify(req),
      RapydIdentityResponseSchema
    )
  }

  public depositLiquidity(
    req: RapydDepositRequest
  ): Promise<RapydResponse<RapydDepositResponse>> {
    return this.post(
      'account/deposit',
      JSON.stringify(req),
      RapydDepositResponseSchema
    )
  }

  public holdLiquidity(
    req: RapydHoldRequest
  ): Promise<RapydResponse<RapydHoldResponse>> {
    return this.post(
      'account/balance/hold',
      JSON.stringify(req),
      RapydHoldResponseSchema
    )
  }

  public releaseLiquidity(
    req: RapydReleaseRequest
  ): Promise<RapydResponse<RapydReleaseResponse>> {
    return this.post(
      'account/balance/release',
      JSON.stringify(req),
      RapydReleaseResponseSchema
    )
  }

  public getDocumentTypes(
    country: string
  ): Promise<RapydResponse<RapydDocumentType[]>> {
    return this.get(
      `identities/types?country=${country}`
      // RapydDocumentsTypeSchema
    ) as Promise<RapydResponse<RapydDocumentType[]>>
  }

  public issueVirtualAccount(
    req: VirtualAccountRequest
  ): Promise<RapydResponse<VirtualAccountResponse>> {
    return this.post(
      'issuing/bankaccounts',
      JSON.stringify(req),
      VirtualAccountResponseSchema
    )
  }

  public simulateBankTransferToWallet(
    req: SimulateBankTransferToWalletRequest
  ): Promise<RapydResponse<SimulateBankTransferToWalletResponse>> {
    return this.post(
      'issuing/bankaccounts/bankaccounttransfertobankaccount',
      JSON.stringify(req),
      SimulateBankTransferToWalletResponseSchema
    )
  }

  public async transferLiquidity(
    req: RapydTransferRequest
  ): Promise<RapydResponse<RapydSetTransferResponse>> {
    const transferResponse = await this.post(
      'account/transfer',
      JSON.stringify(req),
      RapydSetTransferResponseSchema
    )
    if (transferResponse.status.status !== 'SUCCESS') {
      if (
        transferResponse.status.error_code === 'NOT_ENOUGH_FUNDS' &&
        req.source_ewallet === this.deps.env.RAPYD_SETTLEMENT_EWALLET
      ) {
        // await handleSettlementOutOfFunds(req, env.RAPYD_SETTLEMENT_EWALLET)
      }
      throw new Error(transferResponse.status.message)
    }

    const setTransferResponse = await this.setTransferResponse({
      id: transferResponse.data.id,
      status: 'accept'
    })

    if (setTransferResponse.status.status !== 'SUCCESS') {
      throw new Error(`Unable to set accepted response of wallet transfer`)
    }

    return setTransferResponse
  }

  public getAccountsBalance(
    walletId: string
  ): Promise<RapydResponse<RapydAccountBalance[]>> {
    return this.get(`user/${walletId}/accounts`) as Promise<
      RapydResponse<RapydAccountBalance[]>
    >
  }

  public getCountryNames(): Promise<RapydResponse<RapydCountry[]>> {
    return this.get('data/countries') as Promise<RapydResponse<RapydCountry[]>>
  }

  public async withdrawFundsFromAccount(
    args: WithdrawFundsParams
  ): Promise<RapydResponse<WithdrawFundsFromAccountResponse>> {
    // get list of payout method types for currency, if we get to production: get payout type required fields will be needed
    const payoutType = await this.getPayoutMethodTypes(args.assetCode)

    if (payoutType.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to withdraw funds from your account: ${payoutType.status.message}`
      )
    }

    // withdraw funds/create payout from wallet account into bank account
    const userDetails = {
      name: `${args.user.firstName} ${args.user.lastName}`,
      address: args.user.address ?? ''
    }
    const withdrawReq = {
      beneficiary: userDetails,
      payout_amount: args.amount,
      payout_currency: args.assetCode,
      ewallet: args.user.rapydWalletId ?? '',
      sender: userDetails,
      sender_country: args.user.country ?? '',
      sender_currency: args.assetCode,
      beneficiary_entity_type: 'individual',
      sender_entity_type: 'individual',
      payout_method_type: payoutType.data[0].payout_method_type
    }

    const payout = await this.post(
      'payouts',
      JSON.stringify(withdrawReq),
      WithdrawFundsFromAccountResponseSchema
    )

    if (payout.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to withdraw funds from your account: ${payout.status.message}`
      )
    }

    // complete third party/bank payout
    const completePayoutResponse = await this.completePayout({
      payout: payout.data.id,
      amount: args.amount
    })

    if (completePayoutResponse.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to withdraw funds from your account: ${completePayoutResponse.status.message}`
      )
    }

    return completePayoutResponse
  }

  private getPayoutMethodTypes(
    assetCode: string
  ): Promise<RapydResponse<PayoutMethodResponse[]>> {
    return this.get(
      `payouts/supported_types?payout_currency=${assetCode}&limit=1`
    ) as Promise<RapydResponse<PayoutMethodResponse[]>>
  }

  private completePayout(
    req: CompletePayoutRequest
  ): Promise<RapydResponse<CompletePayoutResponse>> {
    return this.post(
      `payouts/complete/${req.payout}/${req.amount}`,
      JSON.stringify(req),
      CompletePayoutResponseSchema
    )
  }

  private setTransferResponse(
    req: RapydSetTransferResponseRequest
  ): Promise<RapydResponse<RapydSetTransferResponse>> {
    return this.post(
      'account/transfer/response',
      JSON.stringify(req),
      RapydSetTransferResponseSchema
    )
  }

  /*
  const handleSettlementOutOfFunds = async (
    req: RapydTransferRequest,
    settlementWallet: string
  ) => {
    const depositResult = await rapydDepositLiquidity({
      amount: 100000,
      currency: req.currency,
      ewallet: settlementWallet
    })

    if (depositResult.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to automatically refund settlement account upon insufecient funds encountered`
      )
    }
    return await rapydTransferLiquidity(req, true)
  }
  */

  private get<T extends AnyZodObject | ZodEffects<AnyZodObject>>(
    url: string,
    zodResponseSchema?: T
  ) {
    return this.request('get', url, undefined, zodResponseSchema)
  }

  private post<T extends AnyZodObject | ZodEffects<AnyZodObject>>(
    url: string,
    body: string,
    zodResponseSchema?: T
  ) {
    return this.request<T>('post', url, body, zodResponseSchema)
  }

  private put<T extends AnyZodObject | ZodEffects<AnyZodObject>>(
    url: string,
    body: string,
    zodResponseSchema: T
  ) {
    return this.request('put', url, body, zodResponseSchema)
  }

  private calcSignature(params: CalculateSignatureParams): string {
    const timestamp: string = (
      Math.floor(new Date().getTime() / 1000) - 10
    ).toString()
    const toSign: string =
      params.httpMethod +
      params.url +
      params.salt +
      timestamp +
      params.accessKey +
      params.secretKey +
      params.body
    const signature = crypto.enc.Hex.stringify(
      crypto.HmacSHA256(toSign, params.secretKey)
    )
    return crypto.enc.Base64.stringify(crypto.enc.Utf8.parse(signature))
  }

  private getRapydRequestHeader(method: string, url: string, body: string) {
    const salt = crypto.lib.WordArray.random(12).toString()
    const timestamp = (Math.floor(new Date().getTime() / 1000) - 10).toString()

    const signature = this.calcSignature({
      httpMethod: method,
      url: `/v1/${url}`,
      salt,
      accessKey: this.deps.env.RAPYD_ACCESS_KEY,
      secretKey: this.deps.env.RAPYD_SECRET_KEY,
      body
    })

    return {
      'Content-Type': 'application/json',
      'access_key': this.deps.env.RAPYD_ACCESS_KEY,
      salt,
      timestamp,
      signature
    }
  }

  private async request<
    T extends AnyZodObject | ZodEffects<AnyZodObject> | z.ZodTypeAny
  >(
    method: 'get' | 'post' | 'put',
    url: string,
    body?: string,
    zodResponseSchema?: T
  ): Promise<RapydResponse<z.infer<T>>> {
    const headers = this.getRapydRequestHeader(method, url, body ?? '')
    try {
      const res = await axios<z.infer<T>>({
        method,
        url: `${this.deps.env.RAPYD_API}/${url}`,
        ...(body && { data: body }),
        headers
      })

      if (zodResponseSchema) {
        await validateRapydResponse(
          zodResponseSchema as AnyZodObject | ZodEffects<AnyZodObject>,
          res.data
        )
      }

      return res.data
    } catch (e) {
      if (e instanceof AxiosError) {
        this.deps.logger.error(
          `Axios ${method} request for ${url} failed with: ${
            e.message || e.response?.data
          }`
        )
      }
      throw e
    }
  }
}
