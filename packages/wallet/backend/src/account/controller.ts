import type { NextFunction, Request } from 'express'
import { validate } from '@/shared/validate'
import { AccountService } from './service'
import { accountSchema, fundSchema } from './validation'
import { Account } from '@/account/model'
import { Controller, toSuccessResponse } from '@shared/backend'

interface IAccountController {
  createAccount: Controller<Account>
  listAccounts: Controller<Account[]>
  getAccountById: Controller<Account>
  fundAccount: Controller
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

      res.status(200).json(toSuccessResponse(createAccountResult))
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

      res.status(200).json(toSuccessResponse(accounts))
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

      res.status(200).json(toSuccessResponse(getAccountsResult))
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
        body: { amount },
        params: { accountId }
      } = await validate(fundSchema, req)

      const userId = req.session.user.id

      await this.accountService.fundAccount(userId, accountId, amount)

      res.status(200).json(toSuccessResponse(undefined, 'Account funded'))
    } catch (e) {
      next(e)
    }
  }
}
