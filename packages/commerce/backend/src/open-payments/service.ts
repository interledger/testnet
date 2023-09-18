import { TokenCache } from '@/cache/token'
import { Env } from '@/config/env'
import { BadRequest, InternalServerError } from '@/errors'
import { Order } from '@/order/model'
import {
  AuthenticatedClient,
  Grant,
  GrantRequest,
  PaymentPointer,
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
  paymentPointer: PaymentPointer
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

interface CreateIncomingPaymentParams {
  paymentPointer: PaymentPointer
  accessToken: string
  order: Order
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
    const customerPaymentPointer =
      await this.getPaymentPointer(paymentPointerUrl)
    const shopPaymentPointer = await this.getPaymentPointer(
      this.env.PAYMENT_POINTER
    )

    const shopAccessToken = await this.tokenCache
      .get('accessToken')
      .catch(() => {
        this.logger.error('Could not retrieve access token for IP grant.')
        throw new InternalServerError()
      })

    const incomingPayment = await this.createIncomingPayment({
      accessToken: shopAccessToken,
      order: order,
      paymentPointer: shopPaymentPointer
    })

    const quote = await this.createQuote({
      paymentPointer: customerPaymentPointer,
      receiver: incomingPayment.id
    })

    const outgoingPaymentGrant = await this.createOutgoingPaymentGrant({
      orderId: order.id,
      paymentPointer: customerPaymentPointer.id,
      authServer: customerPaymentPointer.authServer,
      sendAmount: quote.sendAmount,
      receiveAmount: quote.receiveAmount
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
    const grant = await this.opClient.grant
      .request(
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

  private async getPaymentPointer(url: string) {
    const paymentPointer = await this.opClient.paymentPointer
      .get({
        url: url
      })
      .catch(() => {
        this.logger.error(`Could not fetch customer payment pointer "${url}".`)
        throw new BadRequest('Invalid payment pointer.')
      })

    this.logger.debug('Payment pointer information', paymentPointer)
    this.logger.debug(JSON.stringify(paymentPointer, null, 2))

    return paymentPointer
  }

  private async createIncomingPayment({
    paymentPointer,
    accessToken,
    order
  }: CreateIncomingPaymentParams) {
    return await this.opClient.incomingPayment
      .create(
        {
          paymentPointer: paymentPointer.id,
          accessToken: accessToken
        },
        {
          incomingAmount: {
            assetCode: paymentPointer.assetCode,
            assetScale: paymentPointer.assetScale,
            value: (order.total * 10 ** paymentPointer.assetScale).toFixed()
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
  }

  private async createQuote({
    paymentPointer,
    receiver
  }: CreateQuoteParams): Promise<Quote> {
    const grant = await this.createNonInteractiveQuoteGrant(
      paymentPointer.authServer,
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
          paymentPointer: paymentPointer.id,
          accessToken: grant.access_token.value
        },
        { receiver }
      )
      .catch(() => {
        this.logger.error(`Could not create quote for receiver ${receiver}.`)
        throw new InternalServerError()
      })
  }
}
