import { NextFunction, Request } from 'express'
import { Logger } from 'winston'
import { validate } from '@/middleware/validate'
import { ISubscriptionService } from './service'
import { IProductService } from '@/product/service'
import {
  createSubscriptionSchema,
  finishSubscriptionSchema
} from '@boutique/shared'
import {
  BadRequest,
  Controller,
  InternalServerError,
  toSuccessResponse
} from '@shared/backend'
import { IOpenPayments } from '@/open-payments/service'
import { BillingInterval, ProductType } from '@/product/model'
import { Order, OrderStatus } from '@/order/model'
import { IOrderService } from '@/order/service'
import {
  buildGrantInterval,
  getNextBillingDate,
  getNextBillingDateFromGrantInterval,
  Subscription,
  SubscriptionStatus
} from './model'
import { Env } from '@/config/env'
import { PaymentStatus } from '@/payment/model'
import { ISubscriptionProcessor } from './processor'
import {
  buildSubscriptionPaymentMetadata,
  getNextSubscriptionPaymentNumber
} from './payment-metadata'

interface CreateResponse {
  redirectUrl: string
}

interface GetParams {
  id?: string
}

interface FinishResponse {
  status: SubscriptionStatus
  nextBillingAt?: Date
}

interface SubscriptionPaymentHistoryItem {
  orderId: string
  paymentNumber?: number
  totalPayments?: number
  paymentId?: string
  orderStatus: string
  paymentStatus?: PaymentStatus
  amount: number
  createdAt: Date
}

interface SubscriptionDetailsResponse {
  subscription: Subscription
  paymentHistory: SubscriptionPaymentHistoryItem[]
}

const derivePaymentStatus = (orderStatus: OrderStatus): PaymentStatus | undefined => {
  switch (orderStatus) {
    case OrderStatus.PROCESSING:
      return PaymentStatus.PENDING
    case OrderStatus.COMPLETED:
      return PaymentStatus.COMPLETED
    case OrderStatus.FAILED:
    case OrderStatus.REJECTED:
      return PaymentStatus.FAILED
    default:
      return undefined
  }
}

export interface ISubscriptionController {
  create: Controller<CreateResponse>
  finish: Controller<FinishResponse>
  reauthorize: Controller<CreateResponse>
  finishReauthorization: Controller<FinishResponse>
  list: Controller<Subscription[]>
  get: Controller<SubscriptionDetailsResponse>
  cancel: Controller<Subscription>
  retry: Controller<Subscription>
}

export class SubscriptionController implements ISubscriptionController {
  constructor(
    private logger: Logger,
    private env: Env,
    private productService: IProductService,
    private orderService: IOrderService,
    private openPayments: IOpenPayments,
    private subscriptionService: ISubscriptionService,
    private subscriptionProcessor: ISubscriptionProcessor
  ) {}

  create = async (
    req: Request,
    res: TypedResponse<CreateResponse>,
    next: NextFunction
  ) => {
    let createdSubscription: Subscription | undefined

    try {
      const { productId, walletAddressUrl } = await validate(
        createSubscriptionSchema,
        req.body
      )

      const product = await this.productService.getById(productId)

      if (product.productType !== ProductType.SUBSCRIPTION) {
        throw new BadRequest('Selected product is not a subscription.')
      }

      if (!product.billingInterval || !product.billingIntervalCount) {
        throw new InternalServerError()
      }

      const buyerWalletAddress = await this.openPayments.getWalletAddressInfo(
        walletAddressUrl
      )

      createdSubscription = await Subscription.transaction(async (trx) => {
        return await this.subscriptionService.create(
          {
            productId,
            quantity: 1,
            amount: product.price,
            currency: buyerWalletAddress.assetCode,
            walletAddress: walletAddressUrl
          },
          trx
        )
      })

      const finishUrl =
        this.env.FRONTEND_URL +
        `/subscriptions/confirmation?subscriptionId=${createdSubscription.id}`
      const grantInterval = this.buildSubscriptionGrantInterval(
        product.billingInterval,
        product.billingIntervalCount
      )

      const grant = await this.openPayments.prepareSubscription({
        walletAddressUrl,
        amount: product.price,
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

      res.status(201).json(toSuccessResponse({ redirectUrl: grant.redirectUrl }))
    } catch (err) {
      if (createdSubscription) {
        await Subscription.transaction(async (trx) => {
          await this.subscriptionService.delete(createdSubscription!.id, trx)
        }).catch((deleteErr) => {
          this.logger.error('Error while reverting failed subscription creation')
          this.logger.error(deleteErr)
        })
      }

      next(err)
    }
  }

  finish = async (
    req: Request<GetParams>,
    res: TypedResponse<FinishResponse>,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params
      if (!id) {
        throw new BadRequest('Subscription ID was not provided.')
      }

      const { interactRef, hash, result } = await validate(
        finishSubscriptionSchema,
        req.body
      )

      const subscription = await this.subscriptionService.ensurePendingState(id)

      if (result) {
        const isRejected = result === 'grant_rejected'
        if (isRejected) {
          await this.subscriptionService.cancel(id)
          res.status(200).json(
            toSuccessResponse({
              status: SubscriptionStatus.CANCELED
            })
          )
          return
        }

        res.status(400).json({
          success: false,
          message: 'FAILED'
        })
        return
      }

      await this.openPayments.verifyHash({
        interactRef,
        receivedHash: hash,
        walletAddressUrl: subscription.walletAddress,
        clientNonce: subscription.clientNonce,
        interactNonce: subscription.interactNonce
      })

      const tokenInfo = await this.openPayments.continueGrant({
        accessToken: subscription.continueToken,
        url: subscription.continueUri,
        interactRef
      })

      const order = await Order.transaction(async (trx) => {
        const newOrder = await this.orderService.create(
          {
            subscriptionId: subscription.id,
              paymentNumber: subscription.currentPeriodNumber,
              totalPayments: subscription.totalPayments,
            orderItems: [{
              productId: subscription.productId,
                quantity: subscription.quantity
            }]
          },
          trx
        )

          return await newOrder.$query(trx).patchAndFetch({
            total: subscription.amount
          })
      })

      const rotatedToken = await this.openPayments.instantBuy({
        order,
        accessToken: tokenInfo.accessToken,
        manageUrl: tokenInfo.manageUrl,
        walletAddressUrl: subscription.walletAddress,
        paymentMetadata: buildSubscriptionPaymentMetadata(order)
      })

      const nextBillingAt = this.getSubscriptionNextBillingAt(subscription)
      const currentPeriodNumber = getNextSubscriptionPaymentNumber({
        currentPeriodNumber: subscription.currentPeriodNumber,
        hasNextBillingAt: Boolean(nextBillingAt)
      })

      const activeSubscription = await this.subscriptionService.activate(id, {
        accessToken: rotatedToken.accessToken,
        manageUrl: rotatedToken.manageUrl,
        latestOrderId: order.id,
        nextBillingAt,
        currentPeriodNumber
      })

      res.status(200).json(
        toSuccessResponse({
          status: activeSubscription.status,
          nextBillingAt: activeSubscription.nextBillingAt
        })
      )
    } catch (err) {
      const subscriptionId = req.params.id

      if (subscriptionId) {
        await this.subscriptionService
          .markPastDue(subscriptionId)
          .catch((markErr) => {
            this.logger.error(
              `Could not mark subscription ${subscriptionId} as past due`
            )
            this.logger.error(markErr)
          })
      }

      next(err)
    }
  }

  reauthorize = async (
    req: Request<GetParams>,
    res: TypedResponse<CreateResponse>,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params
      if (!id) {
        throw new BadRequest('Subscription ID was not provided.')
      }

      const subscription = await this.subscriptionService.get(id)

      if (subscription.status !== SubscriptionStatus.PAST_DUE) {
        throw new BadRequest(
          'Only past due subscriptions can be re-authorized.'
        )
      }

      const finishUrl =
        this.env.WALLET_FRONTEND_URL +
        `/subscriptions/reauthorize/confirmation?subscriptionId=${subscription.id}`
      const grantInterval = this.buildSubscriptionGrantInterval(
        subscription.product.billingInterval,
        subscription.product.billingIntervalCount
      )

      const grant = await this.openPayments.prepareSubscription({
        walletAddressUrl: subscription.walletAddress,
        amount: subscription.amount,
        identifier: subscription.id,
        finishUrl,
        interval: grantInterval
      })

      await this.subscriptionService.setPendingGrantData(subscription.id, {
        continueUri: grant.continueUri,
        continueToken: grant.continueToken,
        interactNonce: grant.interactNonce,
        clientNonce: grant.clientNonce,
        grantInterval,
        walletAddress: grant.walletAddress
      })

      res.status(200).json(toSuccessResponse({ redirectUrl: grant.redirectUrl }))
    } catch (err) {
      next(err)
    }
  }

  finishReauthorization = async (
    req: Request<GetParams>,
    res: TypedResponse<FinishResponse>,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params
      if (!id) {
        throw new BadRequest('Subscription ID was not provided.')
      }

      const { interactRef, hash, result } = await validate(
        finishSubscriptionSchema,
        req.body
      )

      const subscription = await this.subscriptionService.get(id)

      if (subscription.status !== SubscriptionStatus.PAST_DUE) {
        throw new BadRequest(
          'Only past due subscriptions can be re-authorized.'
        )
      }

      if (result) {
        const isRejected = result === 'grant_rejected'

        if (isRejected) {
          res.status(200).json(
            toSuccessResponse({
              status: subscription.status,
              nextBillingAt: subscription.nextBillingAt
            })
          )
          return
        }

        res.status(400).json({
          success: false,
          message: 'FAILED'
        })
        return
      }

      await this.openPayments.verifyHash({
        interactRef,
        receivedHash: hash,
        walletAddressUrl: subscription.walletAddress,
        clientNonce: subscription.clientNonce,
        interactNonce: subscription.interactNonce
      })

      const tokenInfo = await this.openPayments.continueGrant({
        accessToken: subscription.continueToken,
        url: subscription.continueUri,
        interactRef
      })

      const reauthorizedSubscription = await Subscription.transaction(async (trx) => {
        return await subscription.$query(trx).patchAndFetch({
          accessToken: tokenInfo.accessToken,
          manageUrl: tokenInfo.manageUrl
        })
      })

      res.status(200).json(
        toSuccessResponse({
          status: reauthorizedSubscription.status,
          nextBillingAt: reauthorizedSubscription.nextBillingAt
        })
      )
    } catch (err) {
      next(err)
    }
  }

  list = async (
    req: Request,
    res: TypedResponse<Subscription[]>,
    next: NextFunction
  ) => {
    try {
      const walletAddress = req.query.walletAddress?.toString()
      const subscriptions = await this.subscriptionService.list(walletAddress)
      res.status(200).json(toSuccessResponse(subscriptions))
    } catch (err) {
      next(err)
    }
  }

  get = async (
    req: Request<GetParams>,
    res: TypedResponse<SubscriptionDetailsResponse>,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params
      if (!id) {
        throw new BadRequest('Subscription ID was not provided.')
      }

      const subscription = await this.subscriptionService.get(id)
      const orders = await Order.query()
        .where('subscriptionId', '=', id)
        .withGraphFetched('payments')
        .orderBy('createdAt', 'desc')

      const paymentHistory = orders.map((order) => ({
        orderId: order.id,
        paymentNumber: order.paymentNumber,
        totalPayments: order.totalPayments,
        paymentId: order.payments?.id,
        orderStatus: order.status,
        paymentStatus: order.payments?.status ?? derivePaymentStatus(order.status),
        amount: order.total,
        createdAt: order.createdAt
      }))

      res.status(200).json(
        toSuccessResponse({
          subscription,
          paymentHistory
        })
      )
    } catch (err) {
      next(err)
    }
  }

  cancel = async (
    req: Request<GetParams>,
    res: TypedResponse<Subscription>,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params
      if (!id) {
        throw new BadRequest('Subscription ID was not provided.')
      }

      const subscription = await this.subscriptionService.cancel(id)
      res.status(200).json(toSuccessResponse(subscription))
    } catch (err) {
      next(err)
    }
  }

  retry = async (
    req: Request<GetParams>,
    res: TypedResponse<Subscription>,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params
      if (!id) {
        throw new BadRequest('Subscription ID was not provided.')
      }

      const subscription = await this.subscriptionProcessor.retrySubscription(id)
      res.status(200).json(toSuccessResponse(subscription))
    } catch (err) {
      next(err)
    }
  }

  private buildSubscriptionGrantInterval(
    billingInterval?: BillingInterval,
    billingIntervalCount?: number,
    repeats?: number
  ): string {
    if (!billingInterval || !billingIntervalCount) {
      throw new InternalServerError()
    }

    return buildGrantInterval(
      new Date(),
      billingInterval,
      billingIntervalCount,
      repeats
    )
  }

  private getSubscriptionNextBillingAt(
    subscription: Subscription
  ): Date | undefined {
    if (subscription.grantInterval) {
      return getNextBillingDateFromGrantInterval(
        subscription.grantInterval,
        new Date()
      )
    }

    if (
      !subscription.product.billingInterval ||
      !subscription.product.billingIntervalCount
    ) {
      return undefined
    }

    return getNextBillingDate(
      new Date(),
      subscription.product.billingInterval as BillingInterval,
      subscription.product.billingIntervalCount as number
    )
  }
}
