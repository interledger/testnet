import { TokenCache } from '@/cache/token'
import { Env } from '@/config/env'
import { InternalServerError } from '@/errors'
import { Order } from '@/order/model'
import { extractUuidFromUrl } from '@/shared/utils'
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
    const customerPaymentPointer = await this.opClient.paymentPointer.get({
      url: paymentPointerUrl
    })
    this.logger.debug('Customer payment pointer', customerPaymentPointer)
    this.logger.debug(JSON.stringify(customerPaymentPointer, null, 2))

    const shopPaymentPointer = await this.opClient.paymentPointer.get({
      url: this.env.PAYMENT_POINTER
    })
    this.logger.debug('Shop payment pointer')
    this.logger.debug(JSON.stringify(shopPaymentPointer, null, 2))

    const shopAccessToken = await this.tokenCache.get('accessToken')

    const incomingPayment = await this.opClient.incomingPayment.create(
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
    )

    const { quote, quoteId } = await this.createQuote({
      paymentPointerUrl: customerPaymentPointer.id,
      accessToken: quoteGrant.access_token.value,
      receiver: incomingPayment.id
    })

    await order.$query().patch({ quoteId })

    const outgoingPaymentGrant = this.createOutgoingPaymentGrant({
      orderId: order.id,
      paymentPointer: customerPaymentPointer.id,
      authServer: customerPaymentPointer.authServer,
      sendAmount: quote.sendAmount,
      receiveAmount: quote.receiveAmount
    })

    return outgoingPaymentGrant
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
            uri: `${this.env.FRONTEND_URL}/placeholder?orderId=${orderId}`,
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
  }: CreateQuoteParams): Promise<{ quote: Quote; quoteId: string }> {
    const quote = await this.opClient.quote.create(
      {
        paymentPointer: paymentPointerUrl,
        accessToken
      },
      { receiver }
    )

    const quoteId = extractUuidFromUrl(quote.id)
    if (!quoteId) {
      this.logger.error(`Could not extract quote ID from ${quote.id}`)
      throw new InternalServerError()
    }

    return { quote, quoteId }
  }
}
