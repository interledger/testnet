import { createHmac } from 'crypto'
import {
  HTTP_METHODS,
  IApproveUserToGatewayRequest,
  IApproveUserToGatewayResponse,
  IConnectUserToGatewayResponse,
  ICreateManagedUserRequest,
  ICreateManagedUserResponse,
  ICreateTransactionRequest,
  ICreateTransactionResponse,
  ICreateWalletRequest,
  ICreateWalletResponse,
  IGetVaultsResponse,
  IGetWalletResponse,
  IRatesResponse,
  ITokenRequest,
  ITokenResponse,
  IWalletBalance
} from '@/gatehub/types'
import { Env } from '@/config/env'
import {
  DEFAULT_APP_SCOPE,
  HOSTED_WALLET_TYPE,
  ONBOARDING_APP_SCOPE,
  PAYMENT_TYPE,
  PRODUCTION_CLIENT_IDS,
  SANDBOX_CLIENT_IDS,
  SUPPORTED_ASSET_CODES
} from '@/gatehub/consts'
import axios, { AxiosError } from 'axios'
import { Logger } from 'winston'
import { IFRAME_TYPE } from '@wallet/shared/src'
import { BadRequest } from '@shared/backend'

export class GateHubClient {
  private clientIds = SANDBOX_CLIENT_IDS
  private mainUrl = 'sandbox.gatehub.net'

  private iframeMappings: Record<
    IFRAME_TYPE,
    (managedUserId: string) => Promise<string>
  > = {
    deposit: this.getDepositUrl.bind(this),
    withdrawal: this.getWithdrawalUrl.bind(this),
    exchange: this.getExchangeUrl.bind(this),
    onboarding: this.getOnboardingUrl.bind(this)
  }
  constructor(
    private env: Env,
    private logger: Logger
  ) {
    if (this.isProduction) {
      this.clientIds = PRODUCTION_CLIENT_IDS
      this.mainUrl = 'gatehub.net'
    }
  }

  get isProduction() {
    return this.env.NODE_ENV === 'production'
  }

  get apiUrl() {
    return `https://api.${this.mainUrl}`
  }

  get rampUrl() {
    return `https://managed-ramp.${this.mainUrl}`
  }

  get exchangeUrl() {
    return `https://exchange.${this.mainUrl}`
  }

  get onboardingUrl() {
    return `https://onboarding.${this.mainUrl}`
  }

  async getWithdrawalUrl(managedUserId: string): Promise<string> {
    const token = await this.getIframeAuthorizationToken(
      this.clientIds.onOffRamp,
      DEFAULT_APP_SCOPE,
      managedUserId
    )

    return `${this.rampUrl}/?paymentType=${PAYMENT_TYPE.withdrawal}&bearer=${token}`
  }

  async getDepositUrl(managedUserId: string): Promise<string> {
    const token = await this.getIframeAuthorizationToken(
      this.clientIds.onOffRamp,
      DEFAULT_APP_SCOPE,
      managedUserId
    )

    return `${this.rampUrl}/?paymentType=${PAYMENT_TYPE.deposit}&bearer=${token}`
  }

  async getOnboardingUrl(managedUserId: string): Promise<string> {
    const token = await this.getIframeAuthorizationToken(
      this.clientIds.onboarding,
      ONBOARDING_APP_SCOPE,
      managedUserId
    )

    return `${this.onboardingUrl}/?bearer=${token}`
  }

  async getExchangeUrl(managedUserId: string): Promise<string> {
    const token = await this.getIframeAuthorizationToken(
      this.clientIds.exchange,
      DEFAULT_APP_SCOPE,
      managedUserId
    )

    return `${this.exchangeUrl}/?bearer=${token}`
  }

  async getIframeUrl(
    type: IFRAME_TYPE,
    managedUserId: string
  ): Promise<string> {
    if (!this.iframeMappings[type]) {
      throw new BadRequest('Invalid iframe type')
    }

    return await this.iframeMappings[type](managedUserId)
  }

  async getIframeAuthorizationToken(
    clientId: string,
    scope: string[],
    managedUserId: string
  ): Promise<string> {
    const url = `${this.apiUrl}/auth/v1/tokens?clientId=${clientId}`
    const body: ITokenRequest = { scope }

    const response = await this.request<ITokenResponse>(
      'POST',
      url,
      JSON.stringify(body),
      managedUserId
    )

    return response.token
  }

  async updateEmailForManagedUser(
    email: string
  ): Promise<ICreateManagedUserResponse> {
    const url = `${this.apiUrl}/auth/v1/users/managed/email`
    const body: ICreateManagedUserRequest = { email }

    const response = await this.request<ICreateManagedUserResponse>(
      'PUT',
      url,
      JSON.stringify(body)
    )

    return response
  }

  async createManagedUser(email: string): Promise<ICreateManagedUserResponse> {
    const url = `${this.apiUrl}/auth/v1/users/managed`
    const body: ICreateManagedUserRequest = { email }

    const response = await this.request<ICreateManagedUserResponse>(
      'POST',
      url,
      JSON.stringify(body)
    )

    return response
  }

  async getUserState(userId: string): Promise<ICreateManagedUserResponse> {
    const url = `${this.apiUrl}/id/v1/users/${userId}`

    const response = await this.request<ICreateManagedUserResponse>('GET', url)

    return response
  }

  async connectUserToGateway(
    userUuid: string,
    gatewayUuid: string
  ): Promise<IConnectUserToGatewayResponse> {
    const url = `${this.apiUrl}/id/v1/users/${userUuid}/hubs/${gatewayUuid}`

    const response = await this.request<IConnectUserToGatewayResponse>(
      'POST',
      url
    )

    if (!this.isProduction) {
      // Auto approve user to gateway in sandbox environment
      await this.approveUserToGateway(userUuid, gatewayUuid)
    }

    return response
  }

  private async approveUserToGateway(
    userUuid: string,
    gatewayUuid: string
  ): Promise<IApproveUserToGatewayResponse> {
    const url = `${this.apiUrl}/id/v1/hubs/${gatewayUuid}/users/${userUuid}`
    const body: IApproveUserToGatewayRequest = {
      verified: 1,
      reasons: [],
      customMessage: false
    }

    const response = await this.request<IApproveUserToGatewayResponse>(
      'PUT',
      url,
      JSON.stringify(body)
    )

    return response
  }

  async createWallet(
    userUuid: string,
    name: string
  ): Promise<ICreateWalletResponse> {
    const url = `${this.apiUrl}/core/v1/users/${userUuid}/wallets`
    const body: ICreateWalletRequest = {
      name,
      type: HOSTED_WALLET_TYPE
    }

    const response = await this.request<ICreateWalletResponse>(
      'POST',
      url,
      JSON.stringify(body),
      userUuid
    )

    return response
  }

  async getWallet(
    userUuid: string,
    walletId: string
  ): Promise<IGetWalletResponse> {
    const url = `${this.apiUrl}/core/v1/users/${userUuid}/wallets/${walletId}`

    const response = await this.request<IGetWalletResponse>('GET', url)

    return response
  }

  async getWalletBalance(
    walletId: string,
    _userUuid: string
  ): Promise<IWalletBalance[]> {
    const url = `${this.apiUrl}/core/v1/wallets/${walletId}/balances`

    const response = await this.request<IWalletBalance[]>(
      'GET',
      url,
      undefined
      //userUuid
    )

    return response
  }

  async createTransaction(
    body: ICreateTransactionRequest
  ): Promise<ICreateTransactionResponse> {
    const url = `${this.apiUrl}/core/v1/transactions`

    const response = await this.request<ICreateTransactionResponse>(
      'POST',
      url,
      JSON.stringify(body)
    )

    return response
  }

  async getVaults(): Promise<IGetVaultsResponse> {
    const url = `${this.apiUrl}/rates/v1/liquidity_provider/vaults`

    const response = await this.request<IGetVaultsResponse>('GET', url)

    return response
  }

  async getRates(base: string): Promise<Record<string, number>> {
    const url = `${this.apiUrl}/rates/v1/rates/current?counter=${base}&amount=1&useAll=true`

    const response = await this.request<IRatesResponse>('GET', url)

    const flatRates: Record<string, number> = {}
    for (const code of SUPPORTED_ASSET_CODES) {
      const rateObj = response[code]
      if (rateObj && typeof rateObj !== 'string') {
        flatRates[code] = +rateObj.rate
      }
    }

    return flatRates
  }

  private async request<T>(
    method: HTTP_METHODS,
    url: string,
    body?: string,
    managedUserUuid?: string
  ): Promise<T> {
    const timestamp = Date.now().toString()
    const headers = this.getRequestHeaders(
      timestamp,
      method,
      url,
      body ?? '',
      managedUserUuid
    )

    try {
      const res = await axios<T>({
        method,
        url,
        ...(body && { data: body }),
        headers
      })

      this.logger.debug(
        `Axios ${method} request for ${url} succeeded:\n ${JSON.stringify(res.data, undefined, 2)}`,
        body ? JSON.parse(body) : {}
      )

      return res.data
    } catch (e) {
      if (e instanceof AxiosError) {
        this.logger.error(
          `Axios ${method} request for ${url} failed with: ${
            e.message || e.response?.data
          }`,
          body ? JSON.parse(body) : {}
        )
      }
      throw e
    }
  }

  private getRequestHeaders(
    timestamp: string,
    method: HTTP_METHODS,
    url: string,
    body?: string,
    managedUserUuid?: string
  ) {
    return {
      'Content-Type': 'application/json',
      'x-gatehub-app-id': this.env.GATEHUB_ACCESS_KEY,
      'x-gatehub-timestamp': timestamp,
      'x-gatehub-signature': this.getSignature(timestamp, method, url, body),
      ...(managedUserUuid && { 'x-gatehub-managed-user-uuid': managedUserUuid })
    }
  }

  private getSignature(
    timestamp: string,
    method: HTTP_METHODS,
    url: string,
    body?: string
  ) {
    const args = [timestamp, method, url]
    if (body) {
      args.push(body)
    }

    const toSign = args.join('|')
    return createHmac('sha256', this.env.GATEHUB_SECRET_KEY)
      .update(toSign)
      .digest('hex')
  }
}
