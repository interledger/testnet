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
  PaymentPointer,
  PendingGrant,
  Quote,
  isPendingGrant
} from '@interledger/open-payments'
import { randomUUID } from 'crypto'
import { Logger } from 'winston'
import { createHash } from 'crypto'
import { OneClickCache } from '@/cache/one-click'

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
  identifier: string
  paymentPointer: string
  debitAmount: Amount
  receiveAmount: Amount
  nonce: string
}

interface CreateIncomingPaymentParams {
  paymentPointer: PaymentPointer
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
  setupOneClick(paymentPointerUrl: string, amount: number): Promise<string>
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
    const { order, paymentPointerUrl } = params
    const customerPaymentPointer =
      await this.getPaymentPointer(paymentPointerUrl)
    const shopPaymentPointer = await this.getPaymentPointer(
      this.env.PAYMENT_POINTER
    )

    const shopAccessToken = await this.getAccessToken()

    const incomingPayment = await this.createIncomingPayment({
      accessToken: shopAccessToken,
      order: order,
      paymentPointer: shopPaymentPointer
    })

    const quote = await this.createQuote({
      paymentPointer: customerPaymentPointer,
      receiver: incomingPayment.id
    })

    const clientNonce = randomUUID()

    const outgoingPaymentGrant = await this.createOutgoingPaymentGrant({
      identifier: order.id,
      paymentPointer: customerPaymentPointer.id,
      authServer: customerPaymentPointer.authServer,
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
      paymentPointer: customerPaymentPointer.id
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
            paymentPointer: order.payments.paymentPointer,
            accessToken: continuation.access_token.value
          },
          {
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

    const paymentPointer = await this.opClient.paymentPointer.get({
      url: payment.paymentPointer
    })
    const { clientNonce, interactNonce } = payment
    let url = paymentPointer.authServer
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

  public async setupOneClick(
    paymentPointerUrl: string,
    amount: number
  ): Promise<string> {
    const paymentPointer = await this.getPaymentPointer(paymentPointerUrl)
    const clientNonce = randomUUID()
    const clientIdentifer = randomUUID()

    const amountData: Amount = {
      value: (amount * 10 ** paymentPointer.assetScale).toFixed(),
      assetCode: paymentPointer.assetCode,
      assetScale: paymentPointer.assetScale
    }

    const grant = await this.createOutgoingPaymentGrant({
      nonce: clientNonce,
      paymentPointer: paymentPointer.id,
      authServer: paymentPointer.authServer,
      identifier: clientIdentifer,
      debitAmount: amountData,
      receiveAmount: amountData
    })

    this.oneClickCache.set(
      clientIdentifer,
      {
        continueUri: grant.continue.uri,
        continueToken: grant.continue.access_token.value
      },
      6000 * 10 * 5
    )

    return grant.interact.redirect
  }

  private async createOutgoingPaymentGrant(
    params: CreateOutgoingPaymentParams
  ): Promise<PendingGrant> {
    const {
      nonce,
      authServer,
      identifier,
      paymentPointer,
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
                identifier: paymentPointer,
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
              uri: `${this.env.FRONTEND_URL}/checkout/confirmation?orderId=${identifier}`,
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

  private async getPaymentPointer(url: string) {
    const paymentPointer = await this.opClient.paymentPointer
      .get({
        url
      })
      .catch(() => {
        this.logger.error(`Could not fetch payment pointer "${url}".`)
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
