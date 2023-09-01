import type { NextFunction, Request } from 'express'
import type { Logger } from 'winston'
import { validate } from '@/shared/validate'
import { AccountService } from './service'
import {
  accountSchema,
  fundSchema,
  withdrawFundsSchema,
  createExchangeQuoteSchema
} from './validation'
import { Account } from '@/account/model'
import { RatesResponse } from '@/rafiki/service'
import { Quote } from '@/rafiki/backend/generated/graphql'
import { QuoteWithFees } from '@/quote/controller'

interface IAccountController {
  createAccount: ControllerFunction<Account>
  listAccounts: ControllerFunction<Account[]>
  getAccountById: ControllerFunction<Account>
  fundAccount: ControllerFunction
  withdrawFunds: ControllerFunction
}
interface AccountControllerDependencies {
  accountService: AccountService
  logger: Logger
}

export class AccountController implements IAccountController {
  constructor(private deps: AccountControllerDependencies) {}

  createAccount = async (
    req: Request,
    res: CustomResponse<Account>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const {
        body: { name, assetId }
      } = await validate(accountSchema, req)
      const createAccountResult = await this.deps.accountService.createAccount({
        userId,
        name,
        assetId
      })

      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: createAccountResult })
    } catch (e) {
      next(e)
    }
  }

  listAccounts = async (
    req: Request,
    res: CustomResponse<Account[]>,
    next: NextFunction
  ) => {
    const userId = req.session.user.id
    const hasPaymentPointer = req.query['include'] == 'paymentPointers'

    try {
      const accounts = await this.deps.accountService.getAccounts(
        userId,
        hasPaymentPointer
      )

      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: accounts })
    } catch (e) {
      next(e)
    }
  }

  getAccountById = async (
    req: Request,
    res: CustomResponse<Account>,
    next: NextFunction
  ) => {
    const userId = req.session.user.id
    const accountId = req.params.id

    try {
      const getAccountsResult = await this.deps.accountService.getAccountById(
        userId,
        accountId
      )

      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: getAccountsResult })
    } catch (e) {
      next(e)
    }
  }

  fundAccount = async (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => {
    try {
      const {
        body: { amount, accountId }
      } = await validate(fundSchema, req)

      const userId = req.session.user.id

      await this.deps.accountService.fundAccount({ userId, amount, accountId })

      res.status(200).json({ success: true, message: 'Account funded' })
    } catch (e) {
      next(e)
    }
  }

  withdrawFunds = async (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => {
    try {
      const {
        body: { amount, accountId }
      } = await validate(withdrawFundsSchema, req)

      const userId = req.session.user.id

      await this.deps.accountService.withdrawFunds({
        userId,
        amount,
        accountId
      })

      res.status(200).json({ success: true, message: 'Funds withdrawn' })
    } catch (e) {
      next(e)
    }
  }

  getExchangeRates = async (
    req: Request,
    res: CustomResponse<RatesResponse>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const accountId = req.params.accountId

      const rates = await this.deps.accountService.getExchangeRates(
        userId,
        accountId
      )

      res.status(200).json({ success: true, message: 'SUCCESS', data: rates })
    } catch (e) {
      next(e)
    }
  }

  createExchangeQuote = async (
    req: Request,
    res: CustomResponse<QuoteWithFees | Quote>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { accountId } = req.params
      const {
        body: { assetCode, amount }
      } = await validate(createExchangeQuoteSchema, req)

      const quote = await this.deps.accountService.createExchangeQuote({
        userId,
        accountId,
        assetCode,
        amount
      })

      res.status(200).json({ success: true, message: 'SUCCESS', data: quote })
    } catch (e) {
      next(e)
    }
  }
}
