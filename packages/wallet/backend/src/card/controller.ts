import { Request, Response, NextFunction } from 'express'
import { Controller } from '@shared/backend'
import { CardService } from '@/card/service'
import { toSuccessResponse } from '@shared/backend'
import { IMaskedCardDetailsResponse } from './types'

export interface ICardController {
  getMaskedCardDetails: Controller<IMaskedCardDetailsResponse>
  getCardDetails: Controller<IMaskedCardDetailsResponse>
}

export class CardController implements ICardController {
  constructor(private cardService: CardService) {}

  public getMaskedCardDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { cardId } = req.params
      const cardDetails = await this.cardService.getMaskedCardDetails(cardId)
      res.status(200).json(toSuccessResponse(cardDetails))
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
      const { cardId, publicKeyBase64 } = req.params
      const cardDetails = await this.cardService.getCardDetails(cardId, publicKeyBase64)
      res.status(200).json(toSuccessResponse(cardDetails))
    } catch (error) {
      next(error)
    }
  }
}
