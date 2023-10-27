import { TokenCache } from '@/cache/token'
import { Env } from '@/config/env'
import { BadRequest, InternalServerError } from '@/errors'
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
  isPendingGrant
} from '@interledger/open-payments'
import { randomUUID } from 'crypto'
import { Logger } from 'winston'
import { createHash } from 'crypto'

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
  orderId: string
  walletAddress: string
  debitAmount: Amount
  receiveAmount: Amount
  nonce: string
}

interface CreateIncomingPaymentParams {
  walletAddress: WalletAddress
  accessToken: string
  order: Order
}

interface VerifyHashParams {
  interactRef?: string
  receivedHash?: string
  payment: Payment
}

export interface IOpenPayments {
  preparePayment(params: PreparePaymentParams): Promise<PendingGrant>
  createOutgoingPayment(order: Order, interactRef?: string): Promise<void>
  verifyHash(params: VerifyHashParams): Promise<void>
  getIncomingPayment(url: string): Promise<IncomingPayment>
}

export class OpenPayments implements IOpenPayments {
  constructor(
    private env: Env,
    private logger: Logger,
    private opClient: AuthenticatedClient,
    private tokenCache: TokenCache
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
      orderId: order.id,
      walletAddress: customerWalletAddress.id,
      authServer: customerWalletAddress.authServer,
      debitAmount: quote.debitAmount,
      receiveAmount: quote.receiveAmount,
      nonce: clientNonce
    })

    let continueUri = outgoingPaymentGrant.continue.uri
    if (this.env.NODE_ENV === 'development') {
      continueUri = continueUri.replace('localhost', 'rafiki-auth')
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
      const continuation = await this.opClient.grant
        .continue(
          {
            accessToken: order.payments.continueToken,
            url: order.payments.continueUri
          },
          {
            interact_ref: interactRef
          }
        )
        .catch(() => {
          this.logger.error('Could not finish the continuation request.')
          throw new InternalServerError()
        })

      await this.opClient.outgoingPayment
        .create(
          {
            url: new URL(order.payments.walletAddress).origin,
            accessToken: continuation.access_token.value
          },
          {
            walletAddress: order.payments.walletAddress,
            quoteId: order.payments.quoteId,
            metadata: {
              description: 'Purchase at Rafiki Boutique',
              orderRef: order.id
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
    payment
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
      url: payment.walletAddress
    })
    const { clientNonce, interactNonce } = payment
    let url = walletAddress.authServer
    if (this.env.NODE_ENV === 'development') {
      url = url.replace('rafiki-auth', 'localhost')
    }

    const data = `${clientNonce}\n${interactNonce}\n${interactRef}\n${url}/`
    const hash = createHash('sha-256').update(data).digest('base64')

    if (hash !== receivedHash) {
      this.logger.error(`Invalid hash for payment "${payment.id}"`)
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

  private async createOutgoingPaymentGrant(
    params: CreateOutgoingPaymentParams
  ): Promise<PendingGrant> {
    const {
      nonce,
      authServer,
      orderId,
      walletAddress,
      debitAmount,
      receiveAmount
    } = params
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
                limits: {
                  debitAmount,
                  receiveAmount
                }
              }
            ]
          },
          interact: {
            start: ['redirect'],
            finish: {
              method: 'redirect',
              uri: `${this.env.FRONTEND_URL}/checkout/confirmation?orderId=${orderId}`,
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

  private async getWalletAddress(url: string) {
    const walletAddress = await this.opClient.walletAddress
      .get({
        url
      })
      .catch(() => {
        this.logger.error(`Could not fetch wallet address "${url}".`)
        throw new BadRequest('Invalid wallet address.')
      })

    this.logger.debug('Wallet address information', walletAddress)
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
          url: new URL(walletAddress.id).origin,
          accessToken: accessToken
        },
        {
          walletAddress: walletAddress.id,
          incomingAmount: {
            assetCode: walletAddress.assetCode,
            assetScale: walletAddress.assetScale,
            value: (order.total * 10 ** walletAddress.assetScale).toFixed()
          },
          metadata: {
            orderId: order.id,
            description: 'Purchase at Rafiki Boutique'
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: 'interact' should be optional
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
          url: new URL(walletAddress.id).origin,
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
