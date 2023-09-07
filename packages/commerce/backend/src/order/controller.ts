import { NextFunction, Request } from 'express'
import { IOrderService } from './service'
import { Order } from './model'
import { BadRequest } from '@/errors'
import { toSuccessReponse } from '@/shared/utils'
import { Logger } from 'winston'
import { AuthenticatedClient, isPendingGrant } from '@interledger/open-payments'
import { Env } from '@/config/env'
import { InternalServerError } from '@/errors'
import { randomUUID } from 'crypto'

interface GetParams {
  id?: string
}

export interface IOrderController {
  get: Controller<Order>
  create: Controller<unknown>
}

export class OrderController implements IOrderController {
  constructor(
    private env: Env,
    private op: AuthenticatedClient,
    private orderService: IOrderService,
    private logger: Logger
  ) {}

  public async get(
    req: Request<GetParams>,
    res: TypedResponse<Order>,
    next: NextFunction
  ) {
    try {
      const { params } = req
      if (!params.id) {
        throw new BadRequest('Order ID was not provided.')
      }

      const order = await this.orderService.get(params.id)

      res.status(200).json(toSuccessReponse(order))
    } catch (err) {
      this.logger.error(err)
      next(err)
    }
  }

  public async create(
    req: Request<never, never, Array<{ productId: string; quantity: number }>>,
    res: TypedResponse<Order>,
    next: NextFunction
  ) {
    try {
      const { body } = req

      if (body.length === 0) {
        throw new BadRequest('No products provided')
      }
      const order = await Order.transaction(async (trx) => {
        const newOrder = await this.orderService.create(
          { orderItems: body },
          trx
        )
        return await newOrder.calcaulateTotalAmount(trx)
      })

      const customerPaymentPointer = await this.op.paymentPointer.get({
        url: 'http://rafiki-backend/client'
      })

      const shopPaymentPointer = await this.op.paymentPointer.get({
        url: this.env.PAYMENT_POINTER
      })

      const incomingPaymentGrant = await this.op.grant.request(
        { url: shopPaymentPointer.authServer },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: 'interact' should be optional
        {
          access_token: {
            access: [
              {
                type: 'incoming-payment',
                actions: ['read-all', 'create']
              }
            ]
          }
        }
      )

      if (isPendingGrant(incomingPaymentGrant)) {
        this.logger.error('Expected non-interactive incoming payment grant.')
        throw new InternalServerError()
      }

      const incomingPayment = await this.op.incomingPayment.create(
        {
          paymentPointer: shopPaymentPointer.id,
          accessToken: incomingPaymentGrant.access_token.value
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

      const quoteGrant = await this.op.grant.request(
        { url: customerPaymentPointer.authServer },
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

      if (isPendingGrant(quoteGrant)) {
        this.logger.error('Expected non-interactive quote grant.')
        throw new InternalServerError()
      }

      const quote = await this.op.quote.create(
        {
          paymentPointer: customerPaymentPointer.id,
          accessToken: quoteGrant.access_token.value
        },
        { receiver: incomingPayment.id }
      )

      await order.$query().patch({ quoteId: quote.id })

      const outgointPaymentGrant = await this.op.grant.request(
        { url: customerPaymentPointer.authServer },
        {
          access_token: {
            access: [
              {
                type: 'outgoing-payment',
                actions: ['create', 'read', 'list'],
                identifier: customerPaymentPointer.id,
                limits: {
                  sendAmount: quote.sendAmount,
                  receiveAmount: quote.receiveAmount
                }
              }
            ]
          },
          interact: {
            start: ['redirect'],
            finish: {
              method: 'redirect',
              uri: `http://localhost:3030/mock-idp/fake-client?orderId=${order.id}`,
              nonce: randomUUID()
            }
          }
        }
      )

      console.log(outgointPaymentGrant)

      res.status(200).json(toSuccessReponse(order))
    } catch (err) {
      this.logger.error(err)
      next(err)
    }
  }
}
