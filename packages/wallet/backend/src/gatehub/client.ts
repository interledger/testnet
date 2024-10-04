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
  IGetUserStateResponse,
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
import {
  IFRAME_TYPE,
  LockReasonCode,
  IGetTransactionsResponse
} from '@wallet/shared/src'
import { BadRequest } from '@shared/backend'
import type { ICardResponse } from '@wallet/shared'
import {
  ICardDetailsResponse,
  ILinksResponse,
  ICreateCustomerRequest,
  ICreateCustomerResponse,
  ICardProductResponse,
  ICardDetailsRequest,
  ICardLockRequest,
  ICardUnlockRequest,
  ICardLimitResponse,
  ICardLimitRequest
} from '@/card/types'
import { BlockReasonCode } from '@wallet/shared/src'

export class GateHubClient {
  private clientIds = SANDBOX_CLIENT_IDS
  private mainUrl = 'sandbox.gatehub.net'

  private iframeMappings: Record<
    IFRAME_TYPE,
    (managedUserUuid: string) => Promise<string>
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

  async getWithdrawalUrl(managedUserUuid: string): Promise<string> {
    const token = await this.getIframeAuthorizationToken(
      this.clientIds.onOffRamp,
      DEFAULT_APP_SCOPE,
      managedUserUuid
    )

    return `${this.rampUrl}/?paymentType=${PAYMENT_TYPE.withdrawal}&bearer=${token}`
  }

  async getDepositUrl(managedUserUuid: string): Promise<string> {
    const token = await this.getIframeAuthorizationToken(
      this.clientIds.onOffRamp,
      DEFAULT_APP_SCOPE,
      managedUserUuid
    )

    return `${this.rampUrl}/?paymentType=${PAYMENT_TYPE.deposit}&bearer=${token}`
  }

  async getOnboardingUrl(managedUserUuid: string): Promise<string> {
    const token = await this.getIframeAuthorizationToken(
      this.clientIds.onboarding,
      ONBOARDING_APP_SCOPE,
      managedUserUuid
    )

    return `${this.onboardingUrl}/?bearer=${token}`
  }

  async getExchangeUrl(managedUserUuid: string): Promise<string> {
    const token = await this.getIframeAuthorizationToken(
      this.clientIds.exchange,
      DEFAULT_APP_SCOPE,
      managedUserUuid
    )

    return `${this.exchangeUrl}/?bearer=${token}`
  }

  async getIframeUrl(
    type: IFRAME_TYPE,
    managedUserUuid: string
  ): Promise<string> {
    if (!this.iframeMappings[type]) {
      throw new BadRequest('Invalid iframe type')
    }

    return await this.iframeMappings[type](managedUserUuid)
  }

  async getIframeAuthorizationToken(
    clientId: string,
    scope: string[],
    managedUserUuid: string
  ): Promise<string> {
    const url = `${this.apiUrl}/auth/v1/tokens?clientId=${clientId}`
    const body: ITokenRequest = { scope }

    const response = await this.request<ITokenResponse>(
      'POST',
      url,
      JSON.stringify(body),
      {
        managedUserUuid
      }
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

  async getUserState(userId: string): Promise<IGetUserStateResponse> {
    const url = `${this.apiUrl}/id/v1/users/${userId}`

    const response = await this.request<IGetUserStateResponse>('GET', url)

    return response
  }

  async connectUserToGateway(
    managedUserUuid: string,
    gatewayUuid: string
  ): Promise<boolean> {
    const url = `${this.apiUrl}/id/v1/users/${managedUserUuid}/hubs/${gatewayUuid}`

    await this.request<IConnectUserToGatewayResponse>('POST', url, undefined, {
      managedUserUuid
    })

    if (!this.isProduction) {
      // Auto approve user to gateway in sandbox environment
      await this.approveUserToGateway(managedUserUuid, gatewayUuid)

      return true
    }

    return false
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
    managedUserUuid: string,
    name: string
  ): Promise<ICreateWalletResponse> {
    const url = `${this.apiUrl}/core/v1/users/${managedUserUuid}/wallets`
    const body: ICreateWalletRequest = {
      name,
      type: HOSTED_WALLET_TYPE
    }

    const response = await this.request<ICreateWalletResponse>(
      'POST',
      url,
      JSON.stringify(body),
      {
        managedUserUuid
      }
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
    managedUserUuid: string
  ): Promise<IWalletBalance[]> {
    const url = `${this.apiUrl}/core/v1/wallets/${walletId}/balances`

    const response = await this.request<IWalletBalance[]>('GET', url, '', {
      managedUserUuid
    })

    return response
  }

  async createTransaction(
    body: ICreateTransactionRequest,
    managedUserUuid?: string
  ): Promise<ICreateTransactionResponse> {
    const url = `${this.apiUrl}/core/v1/transactions`

    const response = await this.request<ICreateTransactionResponse>(
      'POST',
      url,
      JSON.stringify(body),
      {
        managedUserUuid
      }
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

  // This should be called before creating customers to get the product codes for the card and account
  async fetchCardApplicationProducts(): Promise<ICardProductResponse[]> {
    const url = `${this.apiUrl}/v1/card-applications/${this.env.GATEHUB_CARD_APP_ID}/card-products`
    const response = await this.request<ICardProductResponse[]>('GET', url)
    return response
  }

  async createCustomer(
    requestBody: ICreateCustomerRequest
  ): Promise<ICreateCustomerResponse> {
    const url = `${this.apiUrl}/v1/customers`
    return this.request<ICreateCustomerResponse>(
      'POST',
      url,
      JSON.stringify(requestBody),
      {
        cardAppId: this.env.GATEHUB_CARD_APP_ID
      }
    )
  }

  async getCardsByCustomer(customerId: string): Promise<ICardResponse[]> {
    const url = `${this.apiUrl}/v1/customers/${customerId}/cards`
    return this.request<ICardResponse[]>('GET', url)
  }

  async getCardDetails(
    requestBody: ICardDetailsRequest
  ): Promise<ICardDetailsResponse> {
    const url = `${this.apiUrl}/token/card-data`

    const response = await this.request<ILinksResponse>(
      'POST',
      url,
      JSON.stringify(requestBody),
      {
        cardAppId: this.env.GATEHUB_CARD_APP_ID
      }
    )

    const token = response.token
    if (!token) {
      throw new Error('Failed to obtain token for card data retrieval')
    }

    // TODO change this to direct call to card managing entity
    // Will get this from the GateHub proxy for now
    const cardDetailsUrl = `${this.apiUrl}/v1/proxy/client-device/card-data`
    const cardDetailsResponse = await this.request<ICardDetailsResponse>(
      'GET',
      cardDetailsUrl,
      undefined,
      {
        token
      }
    )

    return cardDetailsResponse
  }

  async getCardTransactions(
    cardId: string,
    pageSize?: number,
    pageNumber?: number
  ): Promise<IGetTransactionsResponse> {
    let url = `${this.apiUrl}/v1/cards/${cardId}/transactions`

    const queryParams: string[] = []

    if (pageSize !== undefined)
      queryParams.push(`pageSize=${encodeURIComponent(pageSize.toString())}`)
    if (pageNumber !== undefined)
      queryParams.push(
        `pageNumber=${encodeURIComponent(pageNumber.toString())}`
      )

    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`
    }

    return this.request<IGetTransactionsResponse>('GET', url)
  }

  async getCardLimits(cardId: string): Promise<ICardLimitResponse[]> {
    const url = `${this.apiUrl}/v1/cards/${cardId}/limits`

    return this.request<ICardLimitResponse[]>('GET', url, undefined, {
      cardAppId: this.env.GATEHUB_CARD_APP_ID
    })
  }

  async createOrOverrideCardLimits(
    cardId: string,
    requestBody: ICardLimitRequest[]
  ): Promise<ICardLimitResponse[]> {
    const url = `${this.apiUrl}/v1/cards/${cardId}/limits`

    return this.request<ICardLimitResponse[]>(
      'POST',
      url,
      JSON.stringify(requestBody),
      {
        cardAppId: this.env.GATEHUB_CARD_APP_ID
      }
    )
  }

  async getPin(
    requestBody: ICardDetailsRequest
  ): Promise<ICardDetailsResponse> {
    const url = `${this.apiUrl}/token/pin`

    const response = await this.request<ILinksResponse>(
      'POST',
      url,
      JSON.stringify(requestBody),
      {
        cardAppId: this.env.GATEHUB_CARD_APP_ID
      }
    )

    const token = response.token
    if (!token) {
      throw new Error('Failed to obtain token for card pin retrieval')
    }

    // TODO change this to direct call to card managing entity
    // Will get this from the GateHub proxy for now
    const cardPinUrl = `${this.apiUrl}/v1/proxy/client-device/pin`
    const cardPinResponse = await this.request<ICardDetailsResponse>(
      'GET',
      cardPinUrl,
      undefined,
      {
        token
      }
    )

    return cardPinResponse
  }

  async changePin(cardId: string, cypher: string): Promise<void> {
    const url = `${this.apiUrl}/token/pin-change`

    const response = await this.request<ILinksResponse>(
      'POST',
      url,
      JSON.stringify({ cardId: cardId }),
      {
        cardAppId: this.env.GATEHUB_CARD_APP_ID
      }
    )

    const token = response.token
    if (!token) {
      throw new Error('Failed to obtain token for card pin retrieval')
    }

    // TODO change this to direct call to card managing entity
    // Will get this from the GateHub proxy for now
    const cardPinUrl = `${this.apiUrl}/v1/proxy/client-device/pin`
    await this.request<void>(
      'POST',
      cardPinUrl,
      JSON.stringify({ cypher: cypher }),
      {
        token
      }
    )
  }

  async lockCard(
    cardId: string,
    reasonCode: LockReasonCode,
    requestBody: ICardLockRequest
  ): Promise<ICardResponse> {
    let url = `${this.apiUrl}/v1/cards/${cardId}/lock`
    url += `?reasonCode=${encodeURIComponent(reasonCode)}`

    return this.request<ICardResponse>(
      'PUT',
      url,
      JSON.stringify(requestBody),
      {
        cardAppId: this.env.GATEHUB_CARD_APP_ID
      }
    )
  }

  async unlockCard(
    cardId: string,
    requestBody: ICardUnlockRequest
  ): Promise<ICardResponse> {
    const url = `${this.apiUrl}/v1/cards/${cardId}/unlock`

    return this.request<ICardResponse>(
      'PUT',
      url,
      JSON.stringify(requestBody),
      {
        cardAppId: this.env.GATEHUB_CARD_APP_ID
      }
    )
  }

  async permanentlyBlockCard(
    cardId: string,
    reasonCode: BlockReasonCode
  ): Promise<ICardResponse> {
    let url = `${this.apiUrl}/v1/cards/${cardId}/block`

    url += `?reasonCode=${encodeURIComponent(reasonCode)}`

    return this.request<ICardResponse>('PUT', url)
  }

  private async request<T>(
    method: HTTP_METHODS,
    url: string,
    body?: string,
    headersOptions?: {
      managedUserUuid?: string
      token?: string
      cardAppId?: string
    }
  ): Promise<T> {
    const timestamp = Date.now().toString()
    const headers = this.getRequestHeaders(
      timestamp,
      method,
      url,
      body ?? '',
      headersOptions
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
    headersOptions?: {
      managedUserUuid?: string
      token?: string
      cardAppId?: string
    }
  ) {
    return {
      'Content-Type': 'application/json',
      'x-gatehub-app-id': this.env.GATEHUB_ACCESS_KEY,
      'x-gatehub-timestamp': timestamp,
      'x-gatehub-signature': this.getSignature(timestamp, method, url, body),
      ...(headersOptions?.managedUserUuid && {
        'x-gatehub-managed-user-uuid': headersOptions.managedUserUuid
      }),
      ...(headersOptions?.cardAppId && {
        'x-gatehub-card-app-id': headersOptions.cardAppId
      }),
      ...(headersOptions?.token && {
        Authorization: `Bearer ${headersOptions.token}`
      })
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
