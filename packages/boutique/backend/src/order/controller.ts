import { NextFunction, Request } from 'express'
import { IOrderService } from './service'
import { Order } from './model'
import { Env } from '@/config/env'
import {
  BadRequest,
  Unauthorized,
  Controller,
  InternalServerError,
  toSuccessResponse
} from '@shared/backend'
import { Logger } from 'winston'
import { IOpenPayments, TokenInfo } from '@/open-payments/service'
import { validate } from '@/middleware/validate'
import { IPaymentService } from '@/payment/service'
import { Knex } from 'knex'
import { OneClickCache } from '@/cache/one-click'
import { IProductService } from '@/product/service'
import { ProductType, BillingInterval } from '@/product/model'
import { ISubscriptionService } from '@/subscription/service'
import { Subscription } from '@/subscription/model'
import { buildGrantInterval } from '@/subscription/model'
import {
  instantBuySchema,
  createOrderSchema,
  finishOrderSchema,
  setupFinishSchema,
  oneClickSetupSchema
} from '@boutique/shared'
import { OpenPaymentsClientError } from '@interledger/open-payments'

type PaymentPlan =
  | 'PAY_IN_FULL'
  | 'INSTALLMENTS_3'
  | 'INSTALLMENTS_6'
  | 'INSTALLMENTS_9'
  | 'INSTALLMENTS_12_DAILY'

interface GetParams {
  id?: string
}

interface CreateResponse {
  redirectUrl: string
}

export interface IOrderController {
  list: Controller<Order[]>
  get: Controller<Order>
  create: Controller<CreateResponse>
  finish: Controller
  setup: Controller<CreateResponse>
  setupFinish: Controller<TokenInfo>
  instantBuy: Controller
}

export class OrderController implements IOrderController {
  constructor(
    private knex: Knex,
    private logger: Logger,
    private env: Env,
    private openPayments: IOpenPayments,
    private productService: IProductService,
    private orderService: IOrderService,
    private paymentService: IPaymentService,
    private subscriptionService: ISubscriptionService,
    private oneClickCache: OneClickCache
  ) {}

  list = async (
    _req: Request,
    res: TypedResponse<Order[]>,
    next: NextFunction
  ) => {
    try {
      const orders = await this.orderService.listStandalone()

      res.status(200).json(toSuccessResponse(orders))
    } catch (err) {
      this.logger.error(err)
      next(err)
    }
  }

  get = async (
    req: Request<GetParams>,
    res: TypedResponse<Order>,
    next: NextFunction
  ) => {
    try {
      const { params } = req
      if (!params.id) {
        throw new BadRequest('Order ID was not provided.')
      }

      const order = await this.orderService.get(params.id)

      res.status(200).json(toSuccessResponse(order))
    } catch (err) {
      this.logger.error(err)
      next(err)
    }
  }

  create = async (
    req: Request,
    res: TypedResponse<CreateResponse>,
    next: NextFunction
  ) => {
    let createdSubscription: Subscription | undefined

    try {
      const { products, walletAddressUrl, paymentPlan } = await validate(
        createOrderSchema,
        req.body
      )

      if (paymentPlan !== 'PAY_IN_FULL') {
        if (products.length !== 1) {
          throw new BadRequest(
            'Installments are only available when checkout contains exactly one product.'
          )
        }

        const [{ productId, quantity }] = products
        const product = await this.productService.getById(productId)

        if (product.productType !== ProductType.ONE_TIME) {
          throw new BadRequest(
            'Installments are only available for one-time products.'
          )
        }

        const totalPayments = this.getInstallmentCount(paymentPlan)
        const totalAmountInMinorUnits = this.toMinorUnits(product.price * quantity)

        if (totalAmountInMinorUnits % totalPayments !== 0) {
          throw new BadRequest(
            'This order total cannot be split evenly into the selected installment plan.'
          )
        }

        const amountPerPayment =
          totalAmountInMinorUnits / totalPayments / 100
        const buyerWalletAddress = await this.openPayments.getWalletAddressInfo(
          walletAddressUrl
        )

        createdSubscription = await Subscription.transaction(async (trx) => {
          return await this.subscriptionService.create(
            {
              productId,
              quantity,
              amount: amountPerPayment,
              currency: buyerWalletAddress.assetCode,
              walletAddress: walletAddressUrl,
              totalPayments
            },
            trx
          )
        })

        const finishUrl =
          this.env.FRONTEND_URL +
          `/subscriptions/confirmation?subscriptionId=${createdSubscription.id}`
        const grantInterval = buildGrantInterval(
          new Date(),
          this.getInstallmentBillingInterval(paymentPlan),
          1,
          totalPayments
        )

        const grant = await this.openPayments.prepareSubscription({
          walletAddressUrl,
          amount: amountPerPayment,
          identifier: createdSubscription.id,
          finishUrl,
          interval: grantInterval
        })

        await this.subscriptionService.setPendingGrantData(createdSubscription.id, {
          continueUri: grant.continueUri,
          continueToken: grant.continueToken,
          interactNonce: grant.interactNonce,
          clientNonce: grant.clientNonce,
          grantInterval,
          walletAddress: grant.walletAddress
        })

        res
          .status(201)
          .json(toSuccessResponse({ redirectUrl: grant.redirectUrl }))
        return
      }

      const order = await Order.transaction(async (trx) => {
        const newOrder = await this.orderService.create(
          { orderItems: products },
          trx
        )
        return await newOrder.calculateTotalAmount(trx)
      })

      const grant = await this.openPayments.preparePayment({
        order,
        walletAddressUrl
      })

      this.logger.debug(JSON.stringify(grant, null, 2))
      res
        .status(201)
        .json(toSuccessResponse({ redirectUrl: grant.interact.redirect }))
    } catch (err) {
      if (createdSubscription) {
        await Subscription.transaction(async (trx) => {
          await this.subscriptionService.delete(createdSubscription!.id, trx)
        }).catch((deleteErr) => {
          this.logger.error('Error while reverting failed installment creation')
          this.logger.error(deleteErr)
        })
      }

      next(err)
    }
  }

  finish = async (req: Request, res: TypedResponse, next: NextFunction) => {
    try {
      const orderId = req.params.id
      if (!orderId) {
        throw new BadRequest('Order ID was not provided.')
      }

      const { interactRef, hash, result } = await validate(
        finishOrderSchema,
        req.body
      )

      const order = await this.orderService.ensurePendingState(orderId)

      if (result) {
        const isRejected = result === 'grant_rejected'
        const status = isRejected ? 200 : 400
        const message = isRejected ? 'SUCCESS' : 'FAILED'
        await this.knex.transaction(async (trx) => {
          await this.paymentService.fail(order.payments, trx)
        })
        res.status(status).json({ success: isRejected, message })
        return
      }

      await this.openPayments.verifyHash({
        interactRef,
        receivedHash: hash,
        clientNonce: order.payments.clientNonce,
        interactNonce: order.payments.interactNonce,
        walletAddressUrl: order.payments.walletAddress
      })
      await this.openPayments.createOutgoingPayment(order, interactRef)

      res.status(200).json({ success: true, message: 'SUCCESS' })
    } catch (err) {
      next(err)
    }
  }

  setup = async (
    req: Request,
    res: TypedResponse<CreateResponse>,
    next: NextFunction
  ) => {
    try {
      const { walletAddressUrl, amount } = await validate(
        oneClickSetupSchema,
        req.body
      )

      const redirectUrl = await this.openPayments.setupOneClick(
        walletAddressUrl,
        Number(amount)
      )
      res.status(200).json(toSuccessResponse({ redirectUrl }))
    } catch (err) {
      next(err)
    }
  }

  setupFinish = async (
    req: Request,
    res: TypedResponse<TokenInfo>,
    next: NextFunction
  ) => {
    try {
      const { interactRef, hash, identifier, result } = await validate(
        setupFinishSchema,
        req.body
      )

      const identifierData = await this.oneClickCache.get(identifier)

      if (!identifierData) {
        this.logger.error(
          `Could not find interaction data for identifier "${identifier}"`
        )
        throw new InternalServerError()
      }

      if (result) {
        const isRejected = result === 'grant_rejected'
        const status = isRejected ? 200 : 400
        const message = isRejected ? 'SUCCESS' : 'FAILED'
        res.status(status).json({ success: isRejected, message })
        return
      }

      await this.openPayments.verifyHash({
        interactRef,
        receivedHash: hash,
        clientNonce: identifierData.clientNonce,
        interactNonce: identifierData.interactNonce,
        walletAddressUrl: identifierData.walletAddressUrl
      })

      const tokenInfo = await this.openPayments.continueGrant({
        accessToken: identifierData.continueToken,
        url: identifierData.continueUri,
        interactRef
      })

      res.status(200).json(
        toSuccessResponse({
          ...tokenInfo,
          walletAddressUrl: identifierData.walletAddressUrl
        })
      )
    } catch (err) {
      next(err)
    }
  }

  instantBuy = async (
    req: Request,
    res: TypedResponse<CreateResponse>,
    next: NextFunction
  ) => {
    let order: Order
    try {
      const args = await validate(instantBuySchema, req.body)

      order = await Order.transaction(async (trx) => {
        const newOrder = await this.orderService.create(
          { orderItems: args.products },
          trx
        )
        return await newOrder.calculateTotalAmount(trx)
      })
      const tokenInfo = await this.openPayments.instantBuy({ order, ...args })

      res.status(200).json(
        toSuccessResponse({
          ...tokenInfo,
          walletAddressUrl: args.walletAddressUrl
        })
      )
    } catch (err) {
      if (err instanceof OpenPaymentsClientError && err.status === 401) {
        next(
          new Unauthorized('Instant-buy is not valid please initiate it again')
        )
        await Order.transaction(async (trx) => {
          return await this.orderService.delete(order!.id, trx)
        })
      } else next(err)
    }
  }

  private getInstallmentCount(paymentPlan: PaymentPlan): number {
    switch (paymentPlan) {
      case 'INSTALLMENTS_3':
        return 3
      case 'INSTALLMENTS_6':
        return 6
      case 'INSTALLMENTS_9':
        return 9
      case 'INSTALLMENTS_12_DAILY':
        return 12
      default:
        throw new BadRequest('Unsupported installment plan.')
    }
  }

  private getInstallmentBillingInterval(paymentPlan: PaymentPlan): BillingInterval {
    switch (paymentPlan) {
      case 'INSTALLMENTS_12_DAILY':
        return BillingInterval.DAY
      case 'INSTALLMENTS_3':
      case 'INSTALLMENTS_6':
      case 'INSTALLMENTS_9':
        return BillingInterval.MONTH
      default:
        throw new BadRequest('Unsupported installment plan.')
    }
  }

  private toMinorUnits(amount: number): number {
    return Math.round((amount + Number.EPSILON) * 100)
  }
}
