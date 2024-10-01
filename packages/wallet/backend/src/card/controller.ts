import { Request, Response, NextFunction } from 'express'
import { Controller } from '@shared/backend'
import { CardService } from '@/card/service'
import { toSuccessResponse } from '@shared/backend'
import {
  ICardDetailsRequest,
  ICardDetailsResponse,
  ICardResponse,
  IGetTransactionsResponse
} from './types'
import { validate } from '@/shared/validate'
import {
  getCardsByCustomerSchema,
  getCardDetailsSchema,
  getCardTransactionsSchema
} from './validation'

export interface ICardController {
  getCardsByCustomer: Controller<ICardDetailsResponse[]>
  getCardDetails: Controller<ICardResponse>
  getCardTransactions: Controller<IGetTransactionsResponse>
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
}
