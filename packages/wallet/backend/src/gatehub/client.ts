import { createHmac } from 'crypto'
import {
  HTTP_METHODS,
  ICreateManagedUserRequest,
  ICreateManagedUserResponse,
  ICreateTransactionRequest,
  ICreateTransactionResponse,
  ICreateWalletRequest,
  ICreateWalletResponse,
  IGetVaultsResponse,
  IGetWalletResponse,
  ITokenRequest,
  ITokenResponse
} from '@/gatehub/types'
import { Env } from '@/config/env'
import {
  DEFAULT_APP_SCOPE,
  HOSTED_WALLET_TYPE,
  ONBOARDING_APP_SCOPE,
  PAYMENT_TYPE,
  PRODUCTION_CLIENT_IDS,
  SANDBOX_CLIENT_IDS
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
    (managerUserId: string) => Promise<string>
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
    if (this.env.NODE_ENV === 'production') {
      this.clientIds = PRODUCTION_CLIENT_IDS
      this.mainUrl = 'gatehub.net'
    }
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

  async getWithdrawalUrl(managerUserId: string): Promise<string> {
    const token = await this.getIframeAuthorizationToken(
      this.clientIds.onOffRamp,
      DEFAULT_APP_SCOPE,
      managerUserId
    )

    return `${this.rampUrl}/?paymentType=${PAYMENT_TYPE.withdrawal}&bearer=${token}`
  }

  async getDepositUrl(managerUserId: string): Promise<string> {
    const token = await this.getIframeAuthorizationToken(
      this.clientIds.onOffRamp,
      DEFAULT_APP_SCOPE,
      managerUserId
    )

    return `${this.rampUrl}/?paymentType=${PAYMENT_TYPE.deposit}&bearer=${token}`
  }

  async getOnboardingUrl(managerUserId: string): Promise<string> {
    const token = await this.getIframeAuthorizationToken(
      this.clientIds.onboarding,
      ONBOARDING_APP_SCOPE,
      managerUserId
    )

    return `${this.onboardingUrl}/?bearer=${token}`
  }

  async getExchangeUrl(managerUserId: string): Promise<string> {
    const token = await this.getIframeAuthorizationToken(
      this.clientIds.exchange,
      DEFAULT_APP_SCOPE,
      managerUserId
    )

    return `${this.exchangeUrl}/?bearer=${token}`
  }

  async getIframeUrl(type: IFRAME_TYPE, managerUserId): Promise<string> {
    if (!this.iframeMappings[type]) {
      throw new BadRequest('Invalid iframe type')
    }

    return await this.iframeMappings[type](managerUserId)
  }

  async getIframeAuthorizationToken(
    clientId: string,
    scope: string[],
    managerUserId: string
  ): Promise<string> {
    const url = `${this.apiUrl}/auth/v1/tokens?${clientId}`
    const body: ITokenRequest = { scope }

    const response: ITokenResponse = await this.request<ITokenResponse>(
      'POST',
      url,
      JSON.stringify(body),
      managerUserId
    )

    return response.token
  }

  async updateEmailForManagedUser(
    email: string
  ): Promise<ICreateManagedUserResponse> {
    const url = `${this.apiUrl}/auth/v1/users/managed/email`
    const body: ICreateManagedUserRequest = { email }

    const response: ICreateManagedUserResponse =
      await this.request<ICreateManagedUserResponse>(
        'PUT',
        url,
        JSON.stringify(body)
      )

    return response
  }

  async createManagedUser(email: string): Promise<ICreateManagedUserResponse> {
    const url = `${this.apiUrl}/auth/v1/users/managed`
    const body: ICreateManagedUserRequest = { email }

    const response: ICreateManagedUserResponse =
      await this.request<ICreateManagedUserResponse>(
        'POST',
        url,
        JSON.stringify(body)
      )

    return response
  }

  async connectUserToGateway(
    userUuid: string,
    gatewayUuid: string
  ): Promise<ICreateManagedUserResponse> {
    const url = `${this.apiUrl}/id/v1/users/${userUuid}/hubs/${gatewayUuid}`

    const response: ICreateManagedUserResponse =
      await this.request<ICreateManagedUserResponse>('POST', url)

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

    const response: ICreateWalletResponse =
      await this.request<ICreateWalletResponse>(
        'POST',
        url,
        JSON.stringify(body)
      )

    return response
  }

  async getWallet(
    userUuid: string,
    walletId: string
  ): Promise<IGetWalletResponse> {
    const url = `${this.apiUrl}/core/v1/users/${userUuid}/wallets/${walletId}`

    const response: IGetWalletResponse = await this.request<IGetWalletResponse>(
      'GET',
      url
    )

    return response
  }

  async createTransaction(
    body: ICreateTransactionRequest
  ): Promise<ICreateTransactionResponse> {
    const url = `${this.apiUrl}/core/v1/transactions`

    const response: ICreateManagedUserResponse =
      await this.request<ICreateManagedUserResponse>(
        'POST',
        url,
        JSON.stringify(body)
      )

    return response
  }

  async getVaults(): Promise<IGetVaultsResponse> {
    const url = `${this.apiUrl}/rates/v1/liquidity_provider/vaults`

    const response: ICreateManagedUserResponse =
      await this.request<ICreateManagedUserResponse>('GET', url)

    return response
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
