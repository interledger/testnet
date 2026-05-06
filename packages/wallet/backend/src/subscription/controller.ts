import { Controller, toSuccessResponse } from '@shared/backend'
import { NextFunction, Request } from 'express'
import {
  ISubscriptionService,
  SubscriptionDetails,
  MerchantSubscriptionDetails,
  MerchantOneTimeOrderRecord,
  MerchantSubscriptionRecord,
  SubscriptionRecord,
  SubscriptionAuthorizationRedirect,
  SubscriptionReauthorizationResult
} from './service'

export interface ISubscriptionController {
  list: Controller<SubscriptionRecord[]>
  listForMerchant: Controller<MerchantSubscriptionRecord[]>
  listOneTimeOrdersForMerchant: Controller<MerchantOneTimeOrderRecord[]>
  getByIdForMerchant: Controller<MerchantSubscriptionDetails>
  getById: Controller<SubscriptionDetails>
  retry: Controller<SubscriptionRecord>
  startReauthorization: Controller<SubscriptionAuthorizationRedirect>
  finishReauthorization: Controller<SubscriptionReauthorizationResult>
}

export class SubscriptionController implements ISubscriptionController {
  constructor(private subscriptionService: ISubscriptionService) {}

  list = async (
    req: Request,
    res: CustomResponse<SubscriptionRecord[]>,
    next: NextFunction
  ) => {
    try {
      const subscriptions = await this.subscriptionService.list(req.session.user.id)
      res.json(toSuccessResponse(subscriptions))
    } catch (e) {
      next(e)
    }
  }

  listForMerchant = async (
    req: Request,
    res: CustomResponse<MerchantSubscriptionRecord[]>,
    next: NextFunction
  ) => {
    try {
      const subscriptions = await this.subscriptionService.listForMerchant(
        req.session.user.id
      )
      res.json(toSuccessResponse(subscriptions))
    } catch (e) {
      next(e)
    }
  }

  listOneTimeOrdersForMerchant = async (
    req: Request,
    res: CustomResponse<MerchantOneTimeOrderRecord[]>,
    next: NextFunction
  ) => {
    try {
      const orders = await this.subscriptionService.listOneTimeOrdersForMerchant(
        req.session.user.id
      )
      res.json(toSuccessResponse(orders))
    } catch (e) {
      next(e)
    }
  }

  getByIdForMerchant = async (
    req: Request,
    res: CustomResponse<MerchantSubscriptionDetails>,
    next: NextFunction
  ) => {
    try {
      const details = await this.subscriptionService.getByIdForMerchant(
        req.session.user.id,
        req.params.id
      )

      res.json(toSuccessResponse(details))
    } catch (e) {
      next(e)
    }
  }

  getById = async (
    req: Request,
    res: CustomResponse<SubscriptionDetails>,
    next: NextFunction
  ) => {
    try {
      const details = await this.subscriptionService.getById(
        req.session.user.id,
        req.params.id
      )

      res.json(toSuccessResponse(details))
    } catch (e) {
      next(e)
    }
  }

  retry = async (
    req: Request,
    res: CustomResponse<SubscriptionRecord>,
    next: NextFunction
  ) => {
    try {
      const subscription = await this.subscriptionService.retry(
        req.session.user.id,
        req.params.id
      )

      res.json(toSuccessResponse(subscription))
    } catch (e) {
      next(e)
    }
  }

  startReauthorization = async (
    req: Request,
    res: CustomResponse<SubscriptionAuthorizationRedirect>,
    next: NextFunction
  ) => {
    try {
      const result = await this.subscriptionService.startReauthorization(
        req.session.user.id,
        req.params.id
      )

      res.json(toSuccessResponse(result))
    } catch (e) {
      next(e)
    }
  }

  finishReauthorization = async (
    req: Request,
    res: CustomResponse<SubscriptionReauthorizationResult>,
    next: NextFunction
  ) => {
    try {
      const result = await this.subscriptionService.finishReauthorization(
        req.session.user.id,
        req.params.id,
        req.body
      )

      res.json(toSuccessResponse(result))
    } catch (e) {
      next(e)
    }
  }
}
