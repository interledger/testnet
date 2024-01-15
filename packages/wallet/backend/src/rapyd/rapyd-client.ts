import axios, { AxiosError } from 'axios'
import crypto from 'crypto-js'
import { Logger } from 'winston'
import { Env } from '@/config/env'
import { User } from '@/user/model'
import RandExp from 'randexp'
import { BadRequest } from '@/errors'
import { AnyZodObject, z, ZodEffects } from 'zod'
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
  VirtualAccountRequest,
  VirtualAccountResponse,
  VirtualAccountResponseSchema,
  WithdrawFundsFromAccountResponse,
  WithdrawFundsFromAccountResponseSchema
} from './response-validation'
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

type PayoutRequiredFieldsParams = {
  senderCountry: string
  senderCurrency: string
  beneficiaryCountry: string
  payoutCurrency: string
  senderEntityType: string
  beneficiaryEntityType: string
  payoutAmount: number
  payoutMethodType: string
}

type RequiredFieldsType = Record<string, string | number | object>

export class RapydClient implements IRapydClient {
  constructor(
    private logger: Logger,
    private env: Env
  ) {}

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

  public async releaseLiquidity(
    req: RapydReleaseRequest,
    isRetry: boolean = false
  ): Promise<RapydResponse<RapydReleaseResponse>> {
    try {
      return this.post(
        'account/balance/release',
        JSON.stringify(req),
        RapydReleaseResponseSchema
      )
    } catch (err) {
      if (
        err instanceof AxiosError &&
        ['ERROR_WALLET_INSUFFICIENT_FUNDS', 'NOT_ENOUGH_FUNDS'].includes(
          err.response?.data?.status?.error_code
        ) &&
        req.ewallet === this.env.RAPYD_SETTLEMENT_EWALLET &&
        !isRetry
      ) {
        await this.handleSettlementOutOfFunds(
          req,
          this.env.RAPYD_SETTLEMENT_EWALLET
        )
        return await this.releaseLiquidity(req, true)
      }

      throw err
    }
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
      VirtualAccountResponseSchema
    )
  }

  public async transferLiquidity(
    req: RapydTransferRequest,
    isRetry: boolean = false
  ): Promise<RapydResponse<RapydSetTransferResponse>> {
    try {
      const transferResponse = await this.post(
        'account/transfer',
        JSON.stringify(req),
        RapydSetTransferResponseSchema
      )

      return await this.setTransferResponse({
        id: transferResponse.data.id,
        status: 'accept'
      })
    } catch (err) {
      if (
        err instanceof AxiosError &&
        ['ERROR_WALLET_INSUFFICIENT_FUNDS', 'NOT_ENOUGH_FUNDS'].includes(
          err.response?.data?.status?.error_code
        ) &&
        req.source_ewallet === this.env.RAPYD_SETTLEMENT_EWALLET &&
        !isRetry
      ) {
        await this.handleSettlementOutOfFunds(
          req,
          this.env.RAPYD_SETTLEMENT_EWALLET
        )
        return await this.transferLiquidity(req, true)
      }

      throw err
    }
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
    const requiredFieldsForPayout = await this.getRequiredFieldsForPayout(
      args,
      payoutType
    )

    const addressDelimiter = ['AUD', 'NZD'].includes(args.assetCode)
      ? ' ; '
      : ','
    const [street, city, postCode] = args.user.address?.split(', ') ?? []
    let address = [street, postCode].join(addressDelimiter)
    if (args.assetCode === 'EUR') address = address.replace(/[,\s]+/g, '')

    // withdraw funds/create payout from wallet account into bank account
    const userDetails: RequiredFieldsType = {
      first_name: args.user.firstName ?? '',
      last_name: args.user.lastName ?? '',
      address,
      city,
      country: args.user.country ?? '',
      iban: 'HU42117730161111101800000000',
      bic_swift: `BARC${payoutType.beneficiary_country.toUpperCase()}22`, // https://docs.rapyd.net/en/bic-swift-numbers-for-testing.html
      date_of_birth: '22/02/1980',
      company_name: 'SimulateWithdraw',
      state: city,
      postcode: postCode
    }

    let withdrawReq: RequiredFieldsType = {
      beneficiary: this.generateRequiredFields(
        requiredFieldsForPayout.beneficiary_required_fields ?? [],
        userDetails
      ),
      payout_amount: args.amount,
      payout_currency: args.assetCode,
      ewallet: args.user.rapydWalletId ?? '',
      sender: this.generateRequiredFields(
        requiredFieldsForPayout.sender_required_fields ?? [],
        userDetails
      ),
      sender_country: args.user.country ?? '',
      sender_currency: args.assetCode,
      beneficiary_entity_type: this.getEntityType(
        payoutType.beneficiary_entity_types
      ),
      sender_entity_type: this.getEntityType(payoutType.sender_entity_types),
      payout_method_type: payoutType.payout_method_type
    }

    withdrawReq = this.generateRequiredFields(
      requiredFieldsForPayout.payout_options ?? [],
      withdrawReq
    )

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

  private async getPayoutMethodTypes(
    assetCode: string
  ): Promise<PayoutMethodResponse> {
    const response = (await this.get(
      `payouts/supported_types?payout_currency=${assetCode}&limit=1`
    )) as RapydResponse<PayoutMethodResponse[]>

    if (response.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to withdraw funds from your account: ${response.status.message}`
      )
    }

    if (!response.data.length) {
      throw new Error(
        `Unable to withdraw funds from your account: no payout methods available`
      )
    }

    const payoutType = response.data[0]

    if (!payoutType.sender_currencies.includes(assetCode)) {
      this.logger.debug(
        `[UNAVAILABLE_PAYOUT_CURRENCY] available sender currencies for asset ${assetCode} are ${payoutType.sender_currencies}`
      )
      throw new BadRequest(
        `Unable to withdraw funds from your account: no payout methods available`
      )
    }

    return payoutType
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

  private handleSettlementOutOfFunds = async (
    req: RapydTransferRequest | RapydReleaseRequest,
    settlementWallet: string
  ) => {
    const depositResult = await this.depositLiquidity({
      amount: 100000,
      currency: req.currency,
      ewallet: settlementWallet
    })

    if (depositResult.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to automatically refund settlement account upon insufecient funds encountered`
      )
    }
  }

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
      accessKey: this.env.RAPYD_ACCESS_KEY,
      secretKey: this.env.RAPYD_SECRET_KEY,
      body
    })

    return {
      'Content-Type': 'application/json',
      'access_key': this.env.RAPYD_ACCESS_KEY,
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
        url: `${this.env.RAPYD_API}/${url}`,
        ...(body && { data: body }),
        headers
      })

      if (zodResponseSchema) {
        await validateRapydResponse(
          zodResponseSchema as AnyZodObject | ZodEffects<AnyZodObject>,
          res.data.data
        )
      }

      return res.data
    } catch (e) {
      if (e instanceof AxiosError) {
        this.logger.error(
          `Axios ${method} request for ${url} failed with: ${
            e.message || e.response?.data
          }`
        )
      }
      throw e
    }
  }

  private async getRequiredFieldsForPayout(
    params: WithdrawFundsParams,
    payoutType: PayoutMethodResponse
  ): Promise<PayoutRequiredFieldsResponse> {
    const args: PayoutRequiredFieldsParams = {
      senderCountry: params.user.country ?? '',
      senderCurrency: params.assetCode,
      beneficiaryCountry: payoutType.beneficiary_country,
      payoutCurrency: params.assetCode,
      beneficiaryEntityType: this.getEntityType(
        payoutType.beneficiary_entity_types
      ),
      senderEntityType: this.getEntityType(payoutType.sender_entity_types),
      payoutAmount: params.amount,
      payoutMethodType: payoutType.payout_method_type
    }

    const response: RapydResponse<PayoutRequiredFieldsResponse> =
      (await this.get(
        `payouts/${args.payoutMethodType}/details?sender_country=${args.senderCountry}&sender_currency=${args.senderCurrency}&beneficiary_country=${args.beneficiaryCountry}&payout_currency=${args.payoutCurrency}&sender_entity_type=${args.senderEntityType}&beneficiary_entity_type=${args.beneficiaryEntityType}&payout_amount=${args.payoutAmount}`
      )) as RapydResponse<PayoutRequiredFieldsResponse>

    if (response.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to withdraw funds from your account: ${response.status.message}`
      )
    }

    return response.data
  }

  private generateRequiredFields(
    schema: RequiredFields[],
    object: RequiredFieldsType
  ): RequiredFieldsType {
    const generatedObject = { ...object }
    schema.forEach((requiredField) => {
      if (!generatedObject[requiredField.name]) {
        generatedObject[requiredField.name] = new RandExp(
          requiredField.regex
        ).gen()
      }
    })

    return generatedObject
  }

  private getEntityType(entityTypes: string[]) {
    return entityTypes.includes('individual') ? 'individual' : entityTypes[0]
  }
}
