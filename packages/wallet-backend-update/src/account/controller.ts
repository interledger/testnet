import { NotFound, Unauthorized } from '@/errors'
import type { NextFunction, Request } from 'express'
import type { Logger } from 'winston'
import { validate } from '../shared/validate'
import { accountSchema } from './schemas/account.schema'
import { AccountService } from './service'
import { fundSchema } from './schemas/fund.schema'
import { Account } from './model'

interface IAccountController {
  createAccount: (
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) => Promise<void>
  listAccounts: (
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) => Promise<void>
  getAccountById: (
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) => Promise<void>
  fundAccount: (
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) => Promise<void>
}
interface AccountControllerDependencies {
  accountService: AccountService
  logger: Logger
}

export class AccountController implements IAccountController {
  constructor(private deps: AccountControllerDependencies) {}

  public async createAccount(
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user.id
      const { name, assetRafikiId: assetId } = await validate(
        accountSchema,
        req
      )

      const createAccountResult = await this.deps.accountService.createAccount(
        userId,
        name,
        assetId
      )
      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: createAccountResult })
    } catch (e) {
      next(e)
    }
  }

  public async listAccounts(
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ): Promise<void> {
    const userId = (req as any).user.id

    try {
      const getAccountsResult = await this.deps.accountService.getAccounts(
        userId
      )

      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: getAccountsResult })
    } catch (e) {
      next(e)
    }
  }

  public async getAccountById(
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ): Promise<void> {
    const userId = (req as any).user.id

    //! TODO: Find out where to get this from, in old code this was req.params.id
    const accountId = ''
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

  public async fundAccount(
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { amount, assetCode } = await validate(fundSchema, req)

      const userId = (req as any).user.id

      await this.deps.accountService.fundAccount(userId, amount, assetCode)

      res.status(200).json({ success: true, message: 'Account funded' })
    } catch (e) {
      next(e)
    }
  }
}
