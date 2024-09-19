import { Request, Response, NextFunction } from 'express';
import { Controller } from '@shared/backend';
import { CardService } from '@/card/service';
import { toSuccessResponse } from '@shared/backend';
import {
  ICardDetailsResponse
} from './types';

export interface ICardController {
  getCardDetails: Controller<ICardDetailsResponse>;
}

export class CardController implements ICardController {
  constructor(private cardsService: CardService) {}

  public getCardDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cardId } = req.params;
      const cardDetails = await this.cardsService.getCardDetails(cardId);
      res.status(200).json(toSuccessResponse(cardDetails));
    } catch (error) {
      next(error);
    }
  };
}