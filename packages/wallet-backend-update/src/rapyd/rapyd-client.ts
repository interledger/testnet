import axios, { AxiosError, AxiosResponse } from 'axios'
import crypto from 'crypto-js'
import { Logger } from 'winston'
import { Env } from '@/config/env'

interface IRapydClient {
  createWallet(
    wallet: RapydWallet
  ): Promise<AxiosResponse<RapydResponse<RapydWallet>>>
  updateProfile(
    profile: RapydProfile
  ): Promise<AxiosResponse<RapydResponse<RapydWallet>>>
  verifyIdentity(
    req: RapydIdentityRequest
  ): Promise<AxiosResponse<RapydResponse<RapydIdentityResponse>>>
  depositLiquidity(
    req: RapydDepositRequest
  ): Promise<AxiosResponse<RapydResponse<RapydDepositResponse>>>
  holdLiquidity(
    req: RapydHoldRequest
  ): Promise<AxiosResponse<RapydResponse<RapydHoldResponse>>>
  releaseLiquidity(
    req: RapydReleaseRequest
  ): Promise<AxiosResponse<RapydResponse<RapydReleaseResponse>>>
  transferLiquidity(
    req: RapydTransferRequest
  ): Promise<AxiosResponse<RapydResponse<RapydSetTransferResponse>>>
  getAccountsBalance(
    walletId: string
  ): Promise<AxiosResponse<RapydResponse<RapydGetAccoutBalanceResponse>>>
  getDocumentTypes(
    country: string
  ): Promise<AxiosResponse<RapydResponse<RapydDocumentType[]>>>
  getCountryNames(): Promise<AxiosResponse<RapydResponse<RapydCountry[]>>>
}

interface RapydClientDependencies {
  logger: Logger
  env: Env
}

export class RapydClient implements IRapydClient {
  constructor(private deps: RapydClientDependencies) {}

  public createWallet(
    wallet: RapydWallet
  ): Promise<AxiosResponse<RapydResponse<RapydWallet>>> {
    return this.post('user', JSON.stringify(wallet))
  }

  public updateProfile(
    profile: RapydProfile
  ): Promise<AxiosResponse<RapydResponse<RapydWallet>>> {
    return this.put('user', JSON.stringify(profile))
  }

  public verifyIdentity(
    req: RapydIdentityRequest
  ): Promise<AxiosResponse<RapydResponse<RapydIdentityResponse>>> {
    return this.post('identities', JSON.stringify(req))
  }

  public depositLiquidity(
    req: RapydDepositRequest
  ): Promise<AxiosResponse<RapydResponse<RapydDepositResponse>>> {
    return this.post('account/deposit', JSON.stringify(req))
  }

  public holdLiquidity(
    req: RapydHoldRequest
  ): Promise<AxiosResponse<RapydResponse<RapydHoldResponse>>> {
    return this.post('account/balance/hold', JSON.stringify(req))
  }

  public releaseLiquidity(
    req: RapydReleaseRequest
  ): Promise<AxiosResponse<RapydResponse<RapydReleaseResponse>>> {
    return this.post('account/balance/release', JSON.stringify(req))
  }

  public getDocumentTypes(
    country: string
  ): Promise<AxiosResponse<RapydResponse<RapydDocumentType[]>>> {
    return this.get(`identities/types?country=${country}`)
  }

  public issueVirtualAccount(
    req: VirtualAccountRequest
  ): Promise<AxiosResponse<RapydResponse<VirtualAccountResponse>>> {
    return this.post('issuing/bankaccounts', JSON.stringify(req))
  }

  public simulateBankTransferToWallet(
    req: SimulateBankTransferToWalletRequest
  ): Promise<
    AxiosResponse<RapydResponse<SimulateBankTransferToWalletResponse>>
  > {
    return this.post(
      'issuing/bankaccounts/bankaccounttransfertobankaccount',
      JSON.stringify(req)
    )
  }

  public async transferLiquidity(
    req: RapydTransferRequest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<AxiosResponse<RapydResponse<RapydSetTransferResponse>>> {
    const transferResponse = await this.post(
      'account/transfer',
      JSON.stringify(req)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((setTransferResponse.status as any).status !== 'SUCCESS') {
      throw new Error(`Unable to set accepted response of wallet transfer`)
    }

    return setTransferResponse
  }

  public getAccountsBalance(
    walletId: string
  ): Promise<RapydGetAccoutBalanceResponse> {
    return this.get(`user/${walletId}/accounts`)
  }

  public getCountryNames(): Promise<
    AxiosResponse<RapydResponse<RapydCountry[]>>
  > {
    return this.get('data/countries')
  }

  private setTransferResponse(
    req: RapydSetTransferResponseRequest
  ): Promise<AxiosResponse<RapydResponse<RapydSetTransferResponse>>> {
    return this.post('account/transfer/response', JSON.stringify(req))
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

  private get(url: string) {
    return this.request('get', url)
  }

  private post(url: string, body: string) {
    return this.request('post', url, body)
  }

  private put(url: string, body: string) {
    return this.request('put', url, body)
  }

  private calcSignature(
    httpMethod: string,
    url: string,
    salt: string,
    accessKey: string,
    secretKey: string,
    body: string
  ): string {
    const timestamp: string = (
      Math.floor(new Date().getTime() / 1000) - 10
    ).toString()
    const toSign: string =
      httpMethod + url + salt + timestamp + accessKey + secretKey + body
    const signature = crypto.enc.Hex.stringify(
      crypto.HmacSHA256(toSign, secretKey)
    )
    return crypto.enc.Base64.stringify(crypto.enc.Utf8.parse(signature))
  }

  private getRapydRequestHeader(method: string, url: string, body: string) {
    const salt = crypto.lib.WordArray.random(12).toString()
    const timestamp = (Math.floor(new Date().getTime() / 1000) - 10).toString()

    const signature = this.calcSignature(
      method,
      `/v1/${url}`,
      salt,
      this.deps.env.RAPYD_ACCESS_KEY,
      this.deps.env.RAPYD_SECRET_KEY,
      body
    )

    return {
      'Content-Type': 'application/json',
      'access_key': this.deps.env.RAPYD_ACCESS_KEY,
      salt,
      timestamp,
      signature
    }
  }

  private async request(
    method: 'get' | 'post' | 'put',
    url: string,
    body?: string
  ) {
    const headers = this.getRapydRequestHeader(method, url, body ?? '')
    try {
      const res = await axios({
        method,
        url,
        ...(body && { data: body }),
        headers
      })
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
