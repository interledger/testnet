import { Request, Response, NextFunction } from 'express'
import { Controller } from '@shared/backend'
import { CardService } from '@/card/service'
import { toSuccessResponse } from '@shared/backend'
import {
  ICardDetailsRequest,
  ICardDetailsResponse,
  ICardLimitRequest,
  ICardLimitResponse,
  ICardLockRequest,
  ICardResponse,
  ICardUnlockRequest
} from './types'
import { validate } from '@/shared/validate'
import {
  getCardsByCustomerSchema,
  getCardDetailsSchema,
  lockCardSchema,
  unlockCardSchema,
  getCardLimitsSchema,
  createOrOverrideCardLimitsSchema
} from './validation'

export interface ICardController {
  getCardsByCustomer: Controller<ICardDetailsResponse[]>
  getCardDetails: Controller<ICardResponse>
  getCardLimits: Controller<ICardLimitResponse[]>
  createOrOverrideCardLimits: Controller<ICardLimitResponse[]>
  lock: Controller<ICardResponse>
  unlock: Controller<ICardResponse>
}

export class CardController implements ICardController {
  constructor(private cardService: CardService) {}

  public getCardsByCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { params } = await validate(getCardsByCustomerSchema, req)
      const { customerId } = params

      const cards = await this.cardService.getCardsByCustomer(customerId)
      res.status(200).json(toSuccessResponse(cards))
    } catch (error) {
      next(error)
    }
  }

  public getCardDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { params, body } = await validate(getCardDetailsSchema, req)
      const { cardId } = params
      const { publicKeyBase64 } = body

      const requestBody: ICardDetailsRequest = { cardId, publicKeyBase64 }
      const cardDetails = await this.cardService.getCardDetails(
        userId,
        requestBody
      )
      res.status(200).json(toSuccessResponse(cardDetails))
    } catch (error) {
      next(error)
    }
  }

  public getCardLimits = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { params } = await validate(getCardLimitsSchema, req)
      const { cardId } = params

      const limits = await this.cardService.getCardLimits(userId, cardId)
      res.status(200).json(toSuccessResponse(limits))
    } catch (error) {
      next(error)
    }
  }

  public createOrOverrideCardLimits = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { params, body } = await validate(
        createOrOverrideCardLimitsSchema,
        req
      )
      const { cardId } = params
      const requestBody: ICardLimitRequest[] = body

      const result = await this.cardService.createOrOverrideCardLimits(
        userId,
        cardId,
        requestBody
      )

      res.status(201).json(toSuccessResponse(result))
    } catch (error) {
      next(error)
    }
  }

  public lock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { params, query, body } = await validate(lockCardSchema, req)
      const { cardId } = params
      const { reasonCode } = query
      const requestBody: ICardLockRequest = body

      const result = await this.cardService.lock(
        cardId,
        reasonCode,
        requestBody
      )

      res.status(200).json(toSuccessResponse(result))
    } catch (error) {
      next(error)
    }
  }

  public unlock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { params, body } = await validate(unlockCardSchema, req)
      const { cardId } = params
      const requestBody: ICardUnlockRequest = body

      const result = await this.cardService.unlock(cardId, requestBody)

      res.status(200).json(toSuccessResponse(result))
    } catch (error) {
      next(error)
    }
  }
}
