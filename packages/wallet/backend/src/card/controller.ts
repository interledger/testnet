import { Request, Response, NextFunction } from 'express'
import {
  BadRequest,
  Controller,
  InternalServerError,
  NotFound
} from '@shared/backend'
import { CardService } from '@/card/service'
import { toSuccessResponse } from '@shared/backend'
import {
  ICardDetailsRequest,
  ICardDetailsResponse,
  ICardLimitRequest,
  ICardLimitResponse,
  ICardLockRequest,
  ICardUnlockRequest
} from './types'
import { ICardResponse, IGetTransactionsResponse } from '@wallet/shared'
import { validate } from '@/shared/validate'
import {
  getCardDetailsSchema,
  lockCardSchema,
  unlockCardSchema,
  getCardLimitsSchema,
  createOrOverrideCardLimitsSchema,
  getCardTransactionsSchema,
  changePinSchema,
  permanentlyBlockCardSchema,
  getTokenForPinChange
} from './validation'
import { Logger } from 'winston'
import { UserService } from '@/user/service'

export interface ICardController {
  getCardsByCustomer: Controller<ICardResponse[]>
  getCardDetails: Controller<ICardDetailsResponse>
  getCardLimits: Controller<ICardLimitResponse[]>
  createOrOverrideCardLimits: Controller<ICardLimitResponse[]>
  getCardTransactions: Controller<IGetTransactionsResponse>
  getPin: Controller<ICardResponse>
  changePin: Controller<void>
  lock: Controller<ICardResponse>
  unlock: Controller<ICardResponse>
  closeCard: Controller<void>
}

export class CardController implements ICardController {
  constructor(
    private cardService: CardService,
    private userService: UserService,
    private logger: Logger
  ) {}

  public getCardsByCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const customerId = req.session.user.customerId

      if (!customerId) {
        this.logger.error(
          `Customer id was not found on session object for user ${req.session.user.id}`
        )
        throw new InternalServerError()
      }

      const cards = await this.cardService.getCardsByCustomer(
        req.session.user.id,
        customerId
      )
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
      const { params, query, body } = await validate(getCardDetailsSchema, req)
      const { cardId } = params
      const { publicKeyBase64 } = query
      const { password } = body

      const requestBody: ICardDetailsRequest = {
        cardId,
        publicKey: publicKeyBase64
      }
      const cardDetails = await this.cardService.getCardDetails(
        userId,
        password,
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

  public getPin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.session.user.id
      const { params, query, body } = await validate(getCardDetailsSchema, req)
      const { cardId } = params
      const { publicKeyBase64 } = query
      const { password } = body

      const requestBody: ICardDetailsRequest = {
        cardId,
        publicKey: publicKeyBase64
      }
      const cardPin = await this.cardService.getPin(
        userId,
        password,
        requestBody
      )
      res.status(200).json(toSuccessResponse(cardPin))
    } catch (error) {
      next(error)
    }
  }

  public getTokenForPinChange = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { params } = await validate(getTokenForPinChange, req)
      const { cardId } = params

      const token = await this.cardService.getTokenForPinChange(userId, cardId)
      res.status(200).json(toSuccessResponse(token))
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
      const { token, cypher } = body

      await this.cardService.changePin(userId, cardId, token, cypher)
      res.status(201).json(toSuccessResponse())
    } catch (error) {
      next(error)
    }
  }

  public lock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.session.user.id
      const { params, query, body } = await validate(lockCardSchema, req)
      const { cardId } = params
      const { reasonCode } = query
      const requestBody: ICardLockRequest = body

      const result = await this.cardService.lock(
        userId,
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
      const userId = req.session.user.id
      const { params, body } = await validate(unlockCardSchema, req)
      const { cardId } = params
      const requestBody: ICardUnlockRequest = body

      const result = await this.cardService.unlock(userId, cardId, requestBody)

      res.status(200).json(toSuccessResponse(result))
    } catch (error) {
      next(error)
    }
  }

  public closeCard = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { params, body } = await validate(permanentlyBlockCardSchema, req)
      const { cardId } = params
      const { reasonCode, password } = body

      const user = await this.userService.getById(userId)

      if (!user) {
        throw new NotFound()
      }

      const passwordIsValid = await user?.verifyPassword(password)
      if (!passwordIsValid) {
        throw new BadRequest('Password is not valid')
      }

      await this.cardService.closeCard(userId, cardId, reasonCode)
      res.status(200).json(toSuccessResponse())
    } catch (error) {
      next(error)
    }
  }
}
