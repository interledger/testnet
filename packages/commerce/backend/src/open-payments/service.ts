import { TokenCache } from '@/cache/token'
import { Env } from '@/config/env'
import { BadRequest, InternalServerError } from '@/errors'
import { Order } from '@/order/model'
import {
  AuthenticatedClient,
  Grant,
  GrantRequest,
  PendingGrant,
  Quote,
  isPendingGrant
} from '@interledger/open-payments'
import { randomUUID } from 'crypto'
import { Logger } from 'winston'

interface PreparePaymentParams {
  order: Order
  paymentPointerUrl: string
}

interface CreateQuoteParams {
  paymentPointerUrl: string
  accessToken: string
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
  paymentPointer: string
  sendAmount: Amount
  receiveAmount: Amount
}

export interface IOpenPayments {
  preparePayment(params: PreparePaymentParams): Promise<PendingGrant>
  createOutgoingPayment(order: Order, interactRef?: string): Promise<void>
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
    const { order, paymentPointerUrl } = params
    const customerPaymentPointer = await this.opClient.paymentPointer
      .get({
        url: paymentPointerUrl
      })
      .catch(() => {
        this.logger.error(
          `Could not fetch customer payment pointer "${paymentPointerUrl}".`
        )
        throw new BadRequest('Invalid payment pointer.')
      })

    this.logger.debug('Customer payment pointer', customerPaymentPointer)
    this.logger.debug(JSON.stringify(customerPaymentPointer, null, 2))

    const shopPaymentPointer = await this.opClient.paymentPointer
      .get({
        url: this.env.PAYMENT_POINTER
      })
      .catch(() => {
        this.logger.error(
          `Could not fetch shop payment pointer "${this.env.PAYMENT_POINTER}".`
        )
        throw new InternalServerError()
      })

    this.logger.debug('Shop payment pointer')
    this.logger.debug(JSON.stringify(shopPaymentPointer, null, 2))

    const shopAccessToken = await this.tokenCache
      .get('accessToken')
      .catch(() => {
        this.logger.error('Could not retrieve access token for IP grant.')
        throw new InternalServerError()
      })

    const incomingPayment = await this.opClient.incomingPayment
      .create(
        {
          paymentPointer: shopPaymentPointer.id,
          accessToken: shopAccessToken
        },
        {
          incomingAmount: {
            assetCode: shopPaymentPointer.assetCode,
            assetScale: shopPaymentPointer.assetScale,
            value: (order.total * 10 ** shopPaymentPointer.assetScale).toFixed()
          },
          metadata: {
            orderId: order.id
          }
        }
      )
      .catch(() => {
        this.logger.error('Unable to create incoming payment.')
        throw new InternalServerError()
      })

    const quoteGrant = await this.createNonInteractiveQuoteGrant(
      customerPaymentPointer.authServer,
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

    const quote = await this.createQuote({
      paymentPointerUrl: customerPaymentPointer.id,
      accessToken: quoteGrant.access_token.value,
      receiver: incomingPayment.id
    }).catch(() => {
      this.logger.error('Unable to create quote.')
      throw new InternalServerError()
    })

    const outgoingPaymentGrant = await this.createOutgoingPaymentGrant({
      orderId: order.id,
      paymentPointer: customerPaymentPointer.id,
      authServer: customerPaymentPointer.authServer,
      sendAmount: quote.sendAmount,
      receiveAmount: quote.receiveAmount
    }).catch(() => {
      this.logger.error('Could not retrieve outgoing payment grant.')
      throw new InternalServerError()
    })

    // TODO: Remove replacing "auth/" when upgrading to the new version.
    let continueUri = outgoingPaymentGrant.continue.uri.replace('auth/', '')
    if (this.env.NODE_ENV === 'development') {
      continueUri = continueUri.replace('localhost', 'rafiki-auth')
    }

    await order.$query().patch({
      quoteId: quote.id,
      paymentPointerUrl: customerPaymentPointer.id,
      continueToken: outgoingPaymentGrant.continue.access_token.value,
      continueUri
    })

    return outgoingPaymentGrant
  }

  public async createOutgoingPayment(
    order: Order,
    interactRef: string
  ): Promise<void> {
    try {
      if (!order.paymentPointerUrl) {
        this.logger.error("Order is missing customer's payment pointer.")
        throw new InternalServerError()
      }

      if (!interactRef) {
        this.logger.error('Missing "interactRef".')
        throw new InternalServerError()
      }

      if (!order.continueToken || !order.continueUri) {
        this.logger.debug(`continueToken - ${order.continueToken}`)
        this.logger.debug(`continueUri - ${order.continueUri}`)
        this.logger.error('Could not find order continuation token or URI.')
        throw new InternalServerError()
      }

      const continuation = await this.opClient.grant
        .continue(
          {
            accessToken: order.continueToken,
            url: order.continueUri
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
            paymentPointer: order.paymentPointerUrl,
            accessToken: continuation.access_token.value
          },
          {
            quoteId: order.quoteId,
            metadata: {
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
      await order.$query().patch({
        quoteId: undefined,
        continueToken: undefined,
        continueUri: undefined
      })
      throw new InternalServerError()
    }
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
    const { authServer, orderId, paymentPointer, sendAmount, receiveAmount } =
      params
    const grant = await this.opClient.grant.request(
      { url: authServer },
      {
        access_token: {
          access: [
            {
              type: 'outgoing-payment',
              actions: ['create', 'read', 'list'],
              identifier: paymentPointer,
              limits: {
                sendAmount,
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
            nonce: randomUUID()
          }
        }
      }
    )

    if (!isPendingGrant(grant)) {
      this.logger.error('Expected interactive outgoing payment grant.')
      throw new InternalServerError()
    }

    return grant
  }

  private async createQuote({
    paymentPointerUrl,
    accessToken,
    receiver
  }: CreateQuoteParams): Promise<Quote> {
    return await this.opClient.quote.create(
      {
        paymentPointer: paymentPointerUrl,
        accessToken
      },
      { receiver }
    )
  }
}
