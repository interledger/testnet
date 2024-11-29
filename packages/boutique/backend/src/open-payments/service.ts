import { TokenCache } from '@/cache/token'
import { Env } from '@/config/env'
import { Order } from '@/order/model'
import { Payment } from '@/payment/model'
import {
  AuthenticatedClient,
  Grant,
  GrantRequest,
  IncomingPayment,
  WalletAddress,
  PendingGrant,
  Quote,
  isPendingGrant,
  GrantContinuation
} from '@interledger/open-payments'
import { randomUUID } from 'crypto'
import { Logger } from 'winston'
import { createHash } from 'crypto'
import { OneClickCache } from '@/cache/one-click'
import { replaceHost } from '@/shared/utils'
import { BadRequest, InternalServerError } from '@shared/backend'

interface PreparePaymentParams {
  order: Order
  walletAddressUrl: string
}

interface CreateQuoteParams {
  walletAddress: WalletAddress
  receiver: string
}

interface Amount {
  value: string
  assetCode: string
  assetScale: number
}

interface CreateOutgoingPaymentParams {
  authServer: string
  identifier: string
  walletAddress: string
  nonce: string
  finishUrl?: string
  limits: {
    debitAmount: Amount
    receiveAmount: Amount
    receiver?: string
  }
}

interface CreateIncomingPaymentParams {
  walletAddress: WalletAddress
  accessToken: string
  order: Order
}

interface VerifyHashParams {
  interactRef?: string
  receivedHash?: string
  walletAddressUrl: string
  clientNonce: string
  interactNonce: string
}

interface ContinueGrantParams {
  accessToken: string
  url: string
  interactRef?: string
}

export interface TokenInfo {
  accessToken: string
  manageUrl: string
}

interface InstantBuyParams {
  order: Order
  accessToken: string
  manageUrl: string
  walletAddressUrl: string
}

export interface IOpenPayments {
  preparePayment(params: PreparePaymentParams): Promise<PendingGrant>
  createOutgoingPayment(order: Order, interactRef?: string): Promise<void>
  verifyHash(params: VerifyHashParams): Promise<void>
  getIncomingPayment(url: string): Promise<IncomingPayment>
  setupOneClick(walletAddressUrl: string, amount: number): Promise<string>
  continueGrant(params: ContinueGrantParams): Promise<TokenInfo>
  instantBuy(
    params: InstantBuyParams
  ): Promise<TokenInfo & { walletAddressurl: string }>
}

export class OpenPayments implements IOpenPayments {
  constructor(
    private env: Env,
    private logger: Logger,
    private opClient: AuthenticatedClient,
    private tokenCache: TokenCache,
    private oneClickCache: OneClickCache
  ) {}

  public async preparePayment(
    params: PreparePaymentParams
  ): Promise<PendingGrant> {
    const { order, walletAddressUrl } = params
    const customerWalletAddress = await this.getWalletAddress(walletAddressUrl)
    const shopWalletAddress = await this.getWalletAddress(
      this.env.PAYMENT_POINTER
    )

    const shopAccessToken = await this.getAccessToken()

    const incomingPayment = await this.createIncomingPayment({
      accessToken: shopAccessToken,
      order: order,
      walletAddress: shopWalletAddress
    })

    const quote = await this.createQuote({
      walletAddress: customerWalletAddress,
      receiver: incomingPayment.id
    })

    const clientNonce = randomUUID()

    const outgoingPaymentGrant = await this.createOutgoingPaymentGrant({
      identifier: order.id,
      walletAddress: customerWalletAddress.id,
      authServer: customerWalletAddress.authServer,
      limits: {
        debitAmount: quote.debitAmount,
        receiveAmount: quote.receiveAmount,
        receiver: incomingPayment.id
      },
      nonce: clientNonce
    })

    let continueUri = outgoingPaymentGrant.continue.uri
    if (this.env.NODE_ENV === 'development') {
      continueUri = replaceHost(continueUri)
    }

    await Payment.query().insert({
      orderId: order.id,
      quoteId: quote.id,
      continueUri,
      continueToken: outgoingPaymentGrant.continue.access_token.value,
      interactUrl: outgoingPaymentGrant.interact.redirect,
      interactNonce: outgoingPaymentGrant.interact.finish,
      incomingPaymentUrl: incomingPayment.id,
      clientNonce,
      walletAddress: customerWalletAddress.id
    })

    return outgoingPaymentGrant
  }

  public async createOutgoingPayment(
    order: Order,
    interactRef: string
  ): Promise<void> {
    try {
      const continuation = await this.continueGrant({
        accessToken: order.payments.continueToken,
        url: order.payments.continueUri,
        interactRef
      })

      await this.opClient.outgoingPayment
        .create(
          {
            url: new URL(order.payments.walletAddress).origin,
            accessToken: continuation.accessToken
          },
          {
            walletAddress: order.payments.walletAddress,
            quoteId: order.payments.quoteId,
            metadata: {
              description: 'Purchase at Test Boutique',
              orderRef: order.id,
              type: 'regular'
            }
          }
        )
        .catch(() => {
          this.logger.error(
            `Error while creating outgoing payment for order ${order.id}.`
          )
          throw new InternalServerError()
        })
    } catch (err) {
      throw new InternalServerError()
    }
  }

  public async verifyHash({
    interactRef,
    receivedHash,
    clientNonce,
    interactNonce,
    walletAddressUrl
  }: VerifyHashParams): Promise<void> {
    if (!interactRef) {
      this.logger.error('Missing interactRef.')
      throw new InternalServerError()
    }

    if (!receivedHash) {
      this.logger.error('Missing received hash.')
      throw new InternalServerError()
    }

    const walletAddress = await this.opClient.walletAddress.get({
      url: walletAddressUrl
    })

    let url = walletAddress.authServer
    if (this.env.NODE_ENV === 'development') {
      url = url.replace('rafiki-auth', 'localhost')
    }

    const data = `${clientNonce}\n${interactNonce}\n${interactRef}\n${url}/`
    const hash = createHash('sha-256').update(data).digest('base64')

    if (hash !== receivedHash) {
      this.logger.error(`Invalid hash.`)
      this.logger.error(`Received hash: "${receivedHash}"`)
      this.logger.error(`Calculated hash: "${hash}"`)
      throw new InternalServerError()
    }
  }

  public async getIncomingPayment(url: string) {
    const accessToken = await this.getAccessToken()
    return await this.opClient.incomingPayment
      .get({
        url,
        accessToken
      })
      .catch(() => {
        this.logger.error(`Could not fetch incoming payment "${url}"`)
        throw new InternalServerError()
      })
  }

  public async setupOneClick(
    walletAddressUrl: string,
    amount: number
  ): Promise<string> {
    const walletAddress = await this.getWalletAddress(walletAddressUrl)
    const clientNonce = randomUUID()
    const clientIdentifer = randomUUID()

    const amountData: Amount = {
      value: (amount * 10 ** walletAddress.assetScale).toFixed(),
      assetCode: walletAddress.assetCode,
      assetScale: walletAddress.assetScale
    }

    const grant = await this.createOutgoingPaymentGrant({
      nonce: clientNonce,
      walletAddress: walletAddress.id,
      authServer: walletAddress.authServer,
      identifier: clientIdentifer,
      limits: {
        debitAmount: amountData,
        receiveAmount: amountData
      },
      finishUrl: `${this.env.FRONTEND_URL}/cart/finish?identifier=${clientIdentifer}`
    })

    let continueUri = grant.continue.uri
    if (this.env.NODE_ENV === 'development') {
      continueUri = replaceHost(continueUri)
    }

    this.oneClickCache.set(
      clientIdentifer,
      {
        walletAddressUrl: walletAddress.id,
        clientNonce: clientNonce,
        interactNonce: grant.interact.finish,
        continueUri,
        continueToken: grant.continue.access_token.value
      },
      6000 * 10 * 5
    )

    return grant.interact.redirect
  }

  public async continueGrant({
    accessToken,
    url,
    interactRef
  }: ContinueGrantParams): Promise<TokenInfo> {
    if (!interactRef) {
      this.logger.error('Missing interactRef.')
      throw new InternalServerError()
    }

    const continuation = await this.opClient.grant
      .continue(
        {
          accessToken,
          url
        },
        {
          interact_ref: interactRef
        }
      )
      .catch(() => {
        this.logger.error('Could not finish the continuation request.')
        throw new InternalServerError()
      })

    if (!this.isGrant(continuation)) {
      this.logger.error('Expected grant response.')
      this.logger.debug(continuation)
      throw new InternalServerError()
    }

    return {
      accessToken: continuation.access_token.value,
      manageUrl: continuation.access_token.manage.replace(
        'localhost',
        'rafiki-auth'
      )
    }
  }

  private isGrant(
    continuation: GrantContinuation | Grant
  ): continuation is Grant {
    return (continuation as Grant).access_token !== undefined
  }

  public async instantBuy(
    params: InstantBuyParams
  ): Promise<TokenInfo & { walletAddressurl: string }> {
    const { order, accessToken, manageUrl, walletAddressUrl } = params

    const customerWalletAddress = await this.getWalletAddress(walletAddressUrl)
    const shopWalletAddress = await this.getWalletAddress(
      this.env.PAYMENT_POINTER
    )
    const shopAccessToken = await this.getAccessToken()
    const incomingPayment = await this.createIncomingPayment({
      accessToken: shopAccessToken,
      order: order,
      walletAddress: shopWalletAddress
    })
    const quote = await this.createQuote({
      walletAddress: customerWalletAddress,
      receiver: incomingPayment.id
    })
    const grant = await this.opClient.token.rotate({
      accessToken,
      url: manageUrl
    })

    const payment = await Payment.query().insert({
      orderId: order.id,
      quoteId: quote.id,
      continueUri: '',
      continueToken: '',
      interactUrl: '',
      interactNonce: '',
      incomingPaymentUrl: incomingPayment.id,
      clientNonce: '',
      walletAddress: customerWalletAddress.id
    })

    await this.opClient.outgoingPayment
      .create(
        {
          url: new URL(payment.walletAddress).origin,
          accessToken: grant.access_token.value
        },
        {
          walletAddress: payment.walletAddress,
          quoteId: payment.quoteId,
          metadata: {
            description: 'Purchase at Test Boutique',
            orderRef: order.id,
            type: 'instant'
          }
        }
      )
      .catch(() => {
        this.logger.error(
          `Error while creating outgoing payment for order ${order.id}.`
        )
        throw new BadRequest(
          'One click buy spending limit exceeded. Please setup one click buy again.'
        )
      })

    return {
      accessToken: grant.access_token.value,
      manageUrl: replaceHost(grant.access_token.manage),
      walletAddressurl: customerWalletAddress.id
    }
  }

  private async createOutgoingPaymentGrant(
    params: CreateOutgoingPaymentParams
  ): Promise<PendingGrant> {
    const { nonce, authServer, identifier, walletAddress, limits, finishUrl } =
      params

    const finish =
      finishUrl ??
      `${this.env.FRONTEND_URL}/checkout/confirmation?orderId=${identifier}`

    const grant = await this.opClient.grant
      .request(
        { url: authServer },
        {
          access_token: {
            access: [
              {
                type: 'outgoing-payment',
                actions: ['create', 'read', 'list'],
                identifier: walletAddress,
                limits
              }
            ]
          },
          interact: {
            start: ['redirect'],
            finish: {
              method: 'redirect',
              uri: finish,
              nonce
            }
          }
        }
      )
      .catch(() => {
        this.logger.error('Could not retrieve outgoing payment grant.')
        throw new InternalServerError()
      })

    if (!isPendingGrant(grant)) {
      this.logger.error('Expected interactive outgoing payment grant.')
      throw new InternalServerError()
    }

    return grant
  }

  private async getAccessToken() {
    return await this.tokenCache.get('accessToken').catch(() => {
      this.logger.error('Could not retrieve access token for IP grant.')
      throw new InternalServerError()
    })
  }

  private async createNonInteractiveQuoteGrant(
    authServer: string,
    options: Omit<GrantRequest, 'client'>
  ): Promise<Grant> {
    const grant = await this.opClient.grant.request(
      { url: authServer },
      options
    )

    if (isPendingGrant(grant)) {
      this.logger.error('Expected non-interactive quote grant.')
      throw new InternalServerError()
    }

    return grant
  }

  private async getWalletAddress(url: string) {
    const walletAddress = await this.opClient.walletAddress
      .get({
        url
      })
      .catch(() => {
        this.logger.error(`Could not fetch payment pointer "${url}".`)
        throw new BadRequest('Invalid payment pointer.')
      })

    this.logger.debug('Payment pointer information', walletAddress)
    this.logger.debug(JSON.stringify(walletAddress, null, 2))

    return walletAddress
  }

  private async createIncomingPayment({
    walletAddress,
    accessToken,
    order
  }: CreateIncomingPaymentParams) {
    return await this.opClient.incomingPayment
      .create(
        {
          url: walletAddress.resourceServer,
          accessToken: accessToken
        },
        {
          expiresAt: new Date(Date.now() + 6000 * 60 * 5).toISOString(),
          walletAddress: walletAddress.id,
          incomingAmount: {
            assetCode: walletAddress.assetCode,
            assetScale: walletAddress.assetScale,
            value: (order.total * 10 ** walletAddress.assetScale).toFixed()
          },
          metadata: {
            orderId: order.id,
            description: 'Purchase at Test Boutique'
          }
        }
      )
      .catch(() => {
        this.logger.error('Unable to create incoming payment.')
        throw new InternalServerError()
      })
  }

  private async createQuote({
    walletAddress,
    receiver
  }: CreateQuoteParams): Promise<Quote> {
    const grant = await this.createNonInteractiveQuoteGrant(
      walletAddress.authServer,
      {
        access_token: {
          access: [
            {
              type: 'quote',
              actions: ['create', 'read']
            }
          ]
        }
      }
    ).catch(() => {
      this.logger.error('Could not retrieve quote grant.')
      throw new InternalServerError()
    })

    return await this.opClient.quote
      .create(
        {
          url: walletAddress.resourceServer,
          accessToken: grant.access_token.value
        },
        {
          method: 'ilp',
          walletAddress: walletAddress.id,
          receiver
        }
      )
      .catch(() => {
        this.logger.error(`Could not create quote for receiver ${receiver}.`)
        throw new InternalServerError()
      })
  }
}
