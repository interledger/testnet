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
  IFundAccountRequest,
  IGetUserStateResponse,
  IGetVaultsResponse,
  IGetWalletForUserResponse,
  IGetWalletResponse,
  IOverrideUserRiskLevelRequest,
  IOverrideUserRiskLevelResponse,
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
  PRODUCTION_VAULT_IDS,
  SANDBOX_CLIENT_IDS,
  SANDBOX_VAULT_IDS
} from '@/gatehub/consts'
import axios, { AxiosError } from 'axios'
import { Logger } from 'winston'
import {
  IFRAME_TYPE,
  LockReasonCode,
  IGetTransactionsResponse
} from '@wallet/shared/src'
import { BadRequest } from '@shared/backend'
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
  ICardLimitRequest,
  ICreateCardRequest,
  CloseCardReason
} from '@/card/types'
import { BlockReasonCode } from '@wallet/shared/src'
import { ICardResponse } from '@wallet/shared'

export class GateHubClient {
  private supportedAssetCodes: string[]
  private clientIds = SANDBOX_CLIENT_IDS
  private vaultIds = SANDBOX_VAULT_IDS
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
      this.vaultIds = PRODUCTION_VAULT_IDS
      this.mainUrl = 'gatehub.net'
    }

    this.supportedAssetCodes = Object.keys(this.vaultIds)
  }

  get isProduction() {
    return this.env.GATEHUB_ENV === 'production'
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

  async getManagedUsers(): Promise<ICreateManagedUserResponse[]> {
    const url = `${this.apiUrl}/auth/v1/users/organization/${this.env.GATEHUB_ORG_ID}`

    const response = await this.request<ICreateManagedUserResponse[]>(
      'GET',
      url
    )

    return response
  }

  /**
   * The meta was createad as `meta.meta.[property]`
   * We should be aware of this when the user signs up (for production)
   */
  async updateMetaForManagedUser(
    userUuid: string,
    meta: Record<string, string>
  ): Promise<void> {
    const url = `${this.apiUrl}/auth/v1/users/managed`
    // This is the reason why the `meta` was created as `meta.meta`.
    // Keeping this as is for consistency
    const body = { meta }

    return await this.request<void>('PUT', url, JSON.stringify(body), {
      managedUserUuid: userUuid
    })
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

  async getUserState(managedUserUuid: string): Promise<IGetUserStateResponse> {
    const url = `${this.apiUrl}/id/v1/users/${managedUserUuid}`

    const response = await this.request<IGetUserStateResponse>(
      'GET',
      url,
      undefined,
      { managedUserUuid }
    )

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
      await this.overrideRiskLevel(managedUserUuid, gatewayUuid)

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

  private async overrideRiskLevel(
    userUuid: string,
    gatewayUuid: string
  ): Promise<IApproveUserToGatewayResponse> {
    const url = `${this.apiUrl}/id/v1/hubs/${gatewayUuid}/users/${userUuid}/overrideRiskLevel`
    const body: IOverrideUserRiskLevelRequest = {
      risk_level: 'VERY_LOW',
      reason: 'Risk level change'
    }

    const response = await this.request<IOverrideUserRiskLevelResponse>(
      'POST',
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

  /**
   * Retrieves the user with its corresponding wallets.
   *
   * !!! The `meta` object is not present here - not the same output as
   * ICreateManagedUserResponse !!!
   */
  async getWalletForUser(userUuid: string): Promise<IGetWalletForUserResponse> {
    const url = `${this.apiUrl}/core/v1/users/${userUuid}`

    const response = await this.request<IGetWalletForUserResponse>(
      'GET',
      url,
      undefined,
      {
        managedUserUuid: userUuid
      }
    )
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
    body: ICreateTransactionRequest | IFundAccountRequest,
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
    for (const code of this.supportedAssetCodes) {
      const rateObj = response[code]
      if (rateObj && typeof rateObj !== 'string') {
        flatRates[code] = 1 / +rateObj.rate
      }
    }

    return flatRates
  }

  /**
   * @deprecated Only used before creating customers to get the product codes for the card and account.
   */
  async fetchCardApplicationProducts(): Promise<ICardProductResponse[]> {
    const url = `${this.apiUrl}/v1/card-applications/${this.env.GATEHUB_CARD_APP_ID}/card-products`
    const response = await this.request<ICardProductResponse[]>('GET', url)
    return response
  }

  async createCustomer(
    managedUserUuid: string,
    requestBody: ICreateCustomerRequest
  ): Promise<ICreateCustomerResponse> {
    const url = `${this.apiUrl}/cards/v1/customers/managed`
    const response = await this.request<ICreateCustomerResponse>(
      'POST',
      url,
      JSON.stringify(requestBody),
      {
        managedUserUuid,
        cardAppId: this.env.GATEHUB_CARD_APP_ID
      }
    )

    return response
  }

  /**
   * @deprecated Only used when ordering cards.
   */
  async orderPlasticForCard(userUuid: string, cardId: string): Promise<void> {
    const url = `${this.apiUrl}/cards/v1/cards/${cardId}/plastic`
    await this.request('POST', url, undefined, {
      managedUserUuid: userUuid,
      cardAppId: this.env.GATEHUB_CARD_APP_ID
    })
  }

  async getCardsByCustomer(
    customerId: string,
    managedUserUuid: string
  ): Promise<ICardResponse[]> {
    const url = `${this.apiUrl}/cards/v1/customers/${customerId}/cards`

    return this.request<ICardResponse[]>('GET', url, undefined, {
      managedUserUuid,
      cardAppId: this.env.GATEHUB_CARD_APP_ID
    })
  }

  async getCardDetails(
    managedUserUuid: string,
    requestBody: ICardDetailsRequest
  ): Promise<ICardDetailsResponse> {
    const url = `${this.apiUrl}/cards/v1/token/card-data`

    const response = await this.request<ILinksResponse>(
      'POST',
      url,
      JSON.stringify(requestBody),
      {
        managedUserUuid,
        cardAppId: this.env.GATEHUB_CARD_APP_ID
      }
    )

    const token = response.token
    if (!token) {
      throw new Error('Failed to obtain token for card data retrieval')
    }

    const res = await fetch(this.env.CARD_DATA_HREF, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    // const cardDetailsUrl = `${this.apiUrl}/cards/v1/proxy/clientDevice/cardData`
    // const cardDetailsResponse = await this.request<ICardDetailsResponse>(
    //   'GET',
    //   cardDetailsUrl,
    //   undefined,
    //   {
    //     managedUserUuid,
    //     token
    //   }
    // )
    // return cardDetailsResponse
    if (!res.ok) {
      throw new Error('Could not fetch card details')
    }
    const cardData = (await res.json()) as ICardDetailsResponse

    return cardData
  }

  async getCardTransactions(
    cardId: string,
    userUuid: string,
    pageSize?: number,
    pageNumber?: number
  ): Promise<IGetTransactionsResponse> {
    let url = `${this.apiUrl}/cards/v1/cards/${cardId}/transactions`

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

    return this.request<IGetTransactionsResponse>('GET', url, undefined, {
      cardAppId: this.env.GATEHUB_CARD_APP_ID,
      managedUserUuid: userUuid
    })
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
    managedUserUuid: string,
    requestBody: ICardDetailsRequest
  ): Promise<ICardDetailsResponse> {
    const url = `${this.apiUrl}/cards/v1/token/pin`
    const response = await this.request<ILinksResponse>(
      'POST',
      url,
      JSON.stringify(requestBody),
      {
        managedUserUuid,
        cardAppId: this.env.GATEHUB_CARD_APP_ID
      }
    )

    const token = response.token
    if (!token) {
      throw new Error('Failed to obtain token for card pin retrieval')
    }

    const resp = await fetch(this.env.CARD_PIN_HREF, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })

    const res = await resp.json()

    return res
    // const cardPinUrl = `${this.apiUrl}/v1/proxy/clientDevice/pin`
    // const cardPinResponse = await this.request<ICardDetailsResponse>(
    //   'GET',
    //   cardPinUrl,
    //   undefined,
    //   {
    //     token
    //   }
    // )

    // return cardPinResponse
  }

  async getTokenForPinChange(
    managedUserUuid: string,
    cardId: string
  ): Promise<string> {
    const url = `${this.apiUrl}/cards/v1/token/pin-change`

    const response = await this.request<ILinksResponse>(
      'POST',
      url,
      JSON.stringify({ cardId: cardId }),
      {
        managedUserUuid,
        cardAppId: this.env.GATEHUB_CARD_APP_ID
      }
    )

    const token = response.token
    if (!token) {
      throw new Error('Failed to obtain token for card pin change')
    }

    return token
  }

  async changePin(token: string, cypher: string): Promise<void> {
    const response = await fetch(this.env.CARD_PIN_HREF, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cypher })
    })

    if (!response.ok) {
      let info = ''
      if (response.headers.get('content-type') === 'application/json') {
        info = await response.json()
      } else {
        info = await response.text()
      }
      this.logger.error(
        `ClientDevice/pin call failed with status ${response.status}: ${info}`
      )
      throw new Error('Could not change the card pin. Please try again')
    }

    this.logger.info('Successfully changed card pin.')

    // TODO: Move to proxy when it's fixed
    // const cardPinUrl = `${this.apiUrl}/cards/v1/proxy/clientDevice/pin`
    // await this.request<void>(
    //   'POST',
    //   cardPinUrl,
    //   JSON.stringify({ cypher: cypher }),
    //   {
    //     managedUserUuid,
    //     token
    //   }
    // )
  }

  async lockCard(
    cardId: string,
    managedUserUuid: string,
    reasonCode: LockReasonCode,
    requestBody: ICardLockRequest
  ): Promise<ICardResponse> {
    const url = `${this.apiUrl}/cards/v1/cards/${cardId}/lock?reasonCode=${encodeURIComponent(reasonCode)}`

    return this.request<ICardResponse>(
      'PUT',
      url,
      JSON.stringify(requestBody),
      {
        managedUserUuid,
        cardAppId: this.env.GATEHUB_CARD_APP_ID
      }
    )
  }

  async unlockCard(
    cardId: string,
    managedUserUuid: string,
    requestBody: ICardUnlockRequest
  ): Promise<ICardResponse> {
    const url = `${this.apiUrl}/cards/v1/cards/${cardId}/unlock`

    return this.request<ICardResponse>(
      'PUT',
      url,
      JSON.stringify(requestBody),
      {
        managedUserUuid,
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

  async closeCard(userUuid: string, cardId: string, reason: CloseCardReason) {
    const url = `${this.apiUrl}/cards/v1/cards/${cardId}/card?reasonCode=${reason}`

    await this.request('DELETE', url, undefined, {
      managedUserUuid: userUuid,
      cardAppId: this.env.GATEHUB_CARD_APP_ID
    })
  }

  /**
   * @deprecated
   */
  async createCard(
    userUuid: string,
    accountId: string,
    payload: ICreateCardRequest
  ) {
    const url = `${this.apiUrl}/cards/v1/cards/${accountId}/card`

    const response = await this.request<ICardResponse>(
      'POST',
      url,
      JSON.stringify(payload),
      {
        managedUserUuid: userUuid,
        cardAppId: this.env.GATEHUB_CARD_APP_ID
      }
    )

    return response
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

  getVaultUuid(assetCode: string): string {
    const vaultId: string | undefined = this.vaultIds[assetCode]

    if (!vaultId) {
      throw new BadRequest(`Unsupported asset code ${assetCode}`)
    }

    return vaultId
  }
}
