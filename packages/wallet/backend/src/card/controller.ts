import { Request, Response, NextFunction } from 'express'
import { Controller, NotFound } from '@shared/backend'
import { CardService } from '@/card/service'
import { toSuccessResponse } from '@shared/backend'
import { IMaskedCardDetailsResponse } from './types'
import { WalletAddressService } from '@/walletAddress/service'

export interface ICardController {
  getMaskedCardDetails: Controller<IMaskedCardDetailsResponse>
  getCardDetails: Controller<IMaskedCardDetailsResponse>
}

export class CardController implements ICardController {
  constructor(
    private cardService: CardService,
    private walletAddressService: WalletAddressService
  ) {}

  public getMaskedCardDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { cardId } = req.params

      const walletAddress = await this.walletAddressService.getByCardId(
        userId,
        cardId
      )

      if (!walletAddress) {
        throw new NotFound('Card not found or not associated with the user.')
      }

      const maskedCardDetails =
        await this.cardService.getMaskedCardDetails(cardId)
      res.status(200).json(toSuccessResponse(maskedCardDetails))
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
      const { cardId, publicKeyBase64 } = req.params

      const walletAddress = await this.walletAddressService.getByCardId(
        userId,
        cardId
      )

      if (!walletAddress) {
        throw new NotFound('Card not found or not associated with the user.')
      }

      const cardDetails = await this.cardService.getCardDetails(
        cardId,
        publicKeyBase64
      )
      res.status(200).json(toSuccessResponse(cardDetails))
    } catch (error) {
      next(error)
    }
  }
}
