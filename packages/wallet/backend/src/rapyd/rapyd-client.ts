import axios, { AxiosError } from 'axios'
import crypto from 'crypto-js'
import { Logger } from 'winston'
import { Env } from '@/config/env'
import { User } from '@/user/model'

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
    return this.post<RapydResponse<RapydWallet>>('user', JSON.stringify(wallet))
  }

  public updateProfile(
    profile: RapydProfile
  ): Promise<RapydResponse<RapydWallet>> {
    return this.put<RapydResponse<RapydWallet>>('user', JSON.stringify(profile))
  }

  public verifyIdentity(
    req: RapydIdentityRequest
  ): Promise<RapydResponse<RapydIdentityResponse>> {
    return this.post<RapydResponse<RapydIdentityResponse>>(
      'identities',
      JSON.stringify(req)
    )
  }

  public depositLiquidity(
    req: RapydDepositRequest
  ): Promise<RapydResponse<RapydDepositResponse>> {
    return this.post<RapydResponse<RapydDepositResponse>>(
      'account/deposit',
      JSON.stringify(req)
    )
  }

  public holdLiquidity(
    req: RapydHoldRequest
  ): Promise<RapydResponse<RapydHoldResponse>> {
    return this.post<RapydResponse<RapydHoldResponse>>(
      'account/balance/hold',
      JSON.stringify(req)
    )
  }

  public releaseLiquidity(
    req: RapydReleaseRequest
  ): Promise<RapydResponse<RapydReleaseResponse>> {
    return this.post<RapydResponse<RapydReleaseResponse>>(
      'account/balance/release',
      JSON.stringify(req)
    )
  }

  public getDocumentTypes(
    country: string
  ): Promise<RapydResponse<RapydDocumentType[]>> {
    return this.get<RapydResponse<RapydDocumentType[]>>(
      `identities/types?country=${country}`
    )
  }

  public issueVirtualAccount(
    req: VirtualAccountRequest
  ): Promise<RapydResponse<VirtualAccountResponse>> {
    return this.post<RapydResponse<VirtualAccountResponse>>(
      'issuing/bankaccounts',
      JSON.stringify(req)
    )
  }

  public simulateBankTransferToWallet(
    req: SimulateBankTransferToWalletRequest
  ): Promise<RapydResponse<SimulateBankTransferToWalletResponse>> {
    return this.post<RapydResponse<SimulateBankTransferToWalletResponse>>(
      'issuing/bankaccounts/bankaccounttransfertobankaccount',
      JSON.stringify(req)
    )
  }

  public async transferLiquidity(
    req: RapydTransferRequest
  ): Promise<RapydResponse<RapydSetTransferResponse>> {
    const transferResponse = await this.post<
      RapydResponse<RapydSetTransferResponse>
    >('account/transfer', JSON.stringify(req))
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
    return this.get<RapydResponse<RapydAccountBalance[]>>(
      `user/${walletId}/accounts`
    )
  }

  public getCountryNames(): Promise<RapydResponse<RapydCountry[]>> {
    return this.get<RapydResponse<RapydCountry[]>>('data/countries')
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

    const payout = await this.post<
      RapydResponse<WithdrawFundsFromAccountResponse>
    >('payouts', JSON.stringify(withdrawReq))

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
    )
  }

  private completePayout(
    req: CompletePayoutRequest
  ): Promise<RapydResponse<CompletePayoutResponse>> {
    return this.post(
      `payouts/complete/${req.payout}/${req.amount}`,
      JSON.stringify(req)
    )
  }

  private setTransferResponse(
    req: RapydSetTransferResponseRequest
  ): Promise<RapydResponse<RapydSetTransferResponse>> {
    return this.post<RapydResponse<RapydSetTransferResponse>>(
      'account/transfer/response',
      JSON.stringify(req)
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

  private get<T>(url: string) {
    return this.request<T>('get', url)
  }

  private post<T>(url: string, body: string) {
    return this.request<T>('post', url, body)
  }

  private put<T>(url: string, body: string) {
    return this.request<T>('put', url, body)
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

  private async request<T = unknown>(
    method: 'get' | 'post' | 'put',
    url: string,
    body?: string
  ) {
    const headers = this.getRapydRequestHeader(method, url, body ?? '')
    try {
      const res = await axios<T>({
        method,
        url: `${this.deps.env.RAPYD_API}/${url}`,
        ...(body && { data: body }),
        headers
      })
      return res.data
    } catch (e) {
      this.deps.logger.error(e)
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
