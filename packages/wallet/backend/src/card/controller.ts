import { Request, Response, NextFunction } from 'express'
import { Controller, NotFound } from '@shared/backend'
import { CardService } from '@/card/service'
import { toSuccessResponse } from '@shared/backend'
import {
  ICardDetailsRequest,
  ICardDetailsResponse,
  ICardResponse
} from './types'
import { WalletAddressService } from '@/walletAddress/service'
import { validate } from '@/shared/validate'
import { getCardsByCustomerSchema, getCardDetailsSchema } from './validation'

export interface ICardController {
  getCardsByCustomer: Controller<ICardDetailsResponse[]>
  getCardDetails: Controller<ICardResponse>
}

export class CardController implements ICardController {
  constructor(
    private cardService: CardService,
    private walletAddressService: WalletAddressService
  ) {}

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

      const walletAddress = await this.walletAddressService.getByCardId(
        userId,
        cardId
      )

      if (!walletAddress) {
        throw new NotFound('Card not found or not associated with the user.')
      }

      const requestBody: ICardDetailsRequest = { cardId, publicKeyBase64 }
      const cardDetails = await this.cardService.getCardDetails(requestBody)
      res.status(200).json(toSuccessResponse(cardDetails))
    } catch (error) {
      next(error)
    }
  }
}
