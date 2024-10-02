import { Request, Response, NextFunction } from 'express'
import { Controller } from '@shared/backend'
import { CardService } from '@/card/service'
import { toSuccessResponse } from '@shared/backend'
import {
  ICardDetailsRequest,
  ICardDetailsResponse,
  ICardLockRequest,
  ICardResponse,
  ICardUnlockRequest
} from './types'
import { IGetTransactionsResponse } from '@wallet/shared/src'
import { validate } from '@/shared/validate'
import {
  getCardsByCustomerSchema,
  getCardDetailsSchema,
  lockCardSchema,
  unlockCardSchema,
  getCardTransactionsSchema,
  changePinSchema,
  permanentlyBlockCardSchema
} from './validation'

export interface ICardController {
  getCardsByCustomer: Controller<ICardDetailsResponse[]>
  getCardDetails: Controller<ICardResponse>
  getCardTransactions: Controller<IGetTransactionsResponse>
  getPin: Controller<ICardResponse>
  changePin: Controller<void>
  lock: Controller<ICardResponse>
  unlock: Controller<ICardResponse>
  permanentlyBlockCard: Controller<ICardResponse>
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
      const { params, query } = await validate(getCardDetailsSchema, req)
      const { cardId } = params
      const { publicKeyBase64 } = query

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

  public getCardTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { params, query } = await validate(getCardTransactionsSchema, req)
      const { cardId } = params
      const { pageSize, pageNumber } = query

      const transactions = await this.cardService.getCardTransactions(
        userId,
        cardId,
        pageSize,
        pageNumber
      )

      res.status(200).json(toSuccessResponse(transactions))
    } catch (error) {
      next(error)
    }
  }

  public getPin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.session.user.id
      const { params, query } = await validate(getCardDetailsSchema, req)
      const { cardId } = params
      const { publicKeyBase64 } = query

      const requestBody: ICardDetailsRequest = { cardId, publicKeyBase64 }
      const cardPin = await this.cardService.getPin(userId, requestBody)
      res.status(200).json(toSuccessResponse(cardPin))
    } catch (error) {
      next(error)
    }
  }

  public changePin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { params, body } = await validate(changePinSchema, req)
      const { cardId } = params
      const { cypher } = body

      const result = await this.cardService.changePin(userId, cardId, cypher)
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

  public permanentlyBlockCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { params, query } = await validate(permanentlyBlockCardSchema, req)
      const { cardId } = params
      const { reasonCode } = query

      const result = await this.cardService.permanentlyBlockCard(
        userId,
        cardId,
        reasonCode
      )
      res.status(200).json(toSuccessResponse(result))
    } catch (error) {
      next(error)
    }
  }
}
