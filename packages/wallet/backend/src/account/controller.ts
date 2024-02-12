import type { NextFunction, Request } from 'express'
import { validate } from '@/shared/validate'
import { AccountService } from './service'
import { accountSchema, fundSchema, withdrawFundsSchema } from './validation'
import { Account } from '@/account/model'

interface IAccountController {
  createAccount: ControllerFunction<Account>
  listAccounts: ControllerFunction<Account[]>
  getAccountById: ControllerFunction<Account>
  fundAccount: ControllerFunction
  withdrawFunds: ControllerFunction
}

export class AccountController implements IAccountController {
  constructor(private accountService: AccountService) {}

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

      const createAccountResult = await this.accountService.createAccount({
        userId,
        name,
        assetId
      })

      res.status(200).json({
        success: true,
        message: 'SUCCESS',
        result: createAccountResult
      })
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

    let includeWalletAddress, includeWalletKeys
    if (Array.isArray(req.query['include'])) {
      const includesParams: string[] = req.query['include'] as string[]
      includeWalletAddress = includesParams.includes('walletAddresses')
      includeWalletKeys = includesParams.includes('walletAddressKeys')
    } else {
      includeWalletAddress = req.query['include'] == 'walletAddresses'
    }

    try {
      const accounts = await this.accountService.getAccounts(
        userId,
        includeWalletAddress,
        includeWalletKeys
      )

      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', result: accounts })
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
      const getAccountsResult = await this.accountService.getAccountById(
        userId,
        accountId
      )

      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', result: getAccountsResult })
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

      await this.accountService.fundAccount({ userId, amount, accountId })

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

      await this.accountService.withdrawFunds({
        userId,
        amount,
        accountId
      })

      res.status(200).json({ success: true, message: 'Funds withdrawn' })
    } catch (e) {
      next(e)
    }
  }
}
