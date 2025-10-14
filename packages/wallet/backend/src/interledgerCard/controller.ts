import type { NextFunction, Request } from 'express'
import { validate } from '@/shared/validate'
import { CreateCardResponse, InterledgerCardService } from './service'
import { cardIdSchema, cardSchema } from './validation'
import { Controller, toSuccessResponse } from '@shared/backend'
import { Card } from '@/interledgerCard/model'

interface IInterledgerCardController {
  create: Controller<CreateCardResponse>
  list: Controller<Card[]>
  getById: Controller<Card>
  freeze: Controller
  unfreeze: Controller
  terminate: Controller
}

export class InterledgerCardController implements IInterledgerCardController {
  constructor(private interledgerCardService: InterledgerCardService) {}

  create = async (
    req: Request,
    res: CustomResponse<Card>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const {
        body: { accountId, walletAddressId }
      } = await validate(cardSchema, req)

      const createAccountResult = await this.interledgerCardService.create({
        userId,
        accountId,
        walletAddressId
      })

      res.status(200).json(toSuccessResponse(createAccountResult))
    } catch (e) {
      next(e)
    }
  }

  list = async (
    req: Request,
    res: CustomResponse<Card[]>,
    next: NextFunction
  ) => {
    const userId = req.session.user.id

    try {
      const cards = await this.interledgerCardService.list(userId)
      res.status(200).json(toSuccessResponse(cards))
    } catch (e) {
      next(e)
    }
  }

  getById = async (
    req: Request,
    res: CustomResponse<Card>,
    next: NextFunction
  ) => {
    const userId = req.session.user.id
    const {
      params: { cardId }
    } = await validate(cardIdSchema, req)

    try {
      const getAccountsResult = await this.interledgerCardService.getById(
        userId,
        cardId
      )

      res.status(200).json(toSuccessResponse(getAccountsResult))
    } catch (e) {
      next(e)
    }
  }

  activate = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const userId = req.session.user.id
      const {
        params: { cardId }
      } = await validate(cardIdSchema, req)

      await this.interledgerCardService.activate(userId, cardId)

      res.status(200).json(toSuccessResponse())
    } catch (e) {
      next(e)
    }
  }

  freeze = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const userId = req.session.user.id
      const {
        params: { cardId }
      } = await validate(cardIdSchema, req)

      await this.interledgerCardService.freeze(userId, cardId)

      res.status(200).json(toSuccessResponse())
    } catch (e) {
      next(e)
    }
  }

  unfreeze = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const userId = req.session.user.id
      const {
        params: { cardId }
      } = await validate(cardIdSchema, req)

      await this.interledgerCardService.unfreeze(userId, cardId)

      res.status(200).json(toSuccessResponse())
    } catch (e) {
      next(e)
    }
  }

  terminate = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const userId = req.session.user.id
      const {
        params: { cardId }
      } = await validate(cardIdSchema, req)

      await this.interledgerCardService.terminate(userId, cardId)

      res.status(200).json(toSuccessResponse())
    } catch (e) {
      next(e)
    }
  }
}
