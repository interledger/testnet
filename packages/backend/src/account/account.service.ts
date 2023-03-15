import { NextFunction, Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'
import { zParse } from '../middlewares/validator'
import { accountSchema } from './schemas/account.schema'
import { getAsset } from '../rafiki/request/asset.request'
import { Account } from './account.model'
import { getUserIdFromRequest } from '../utils/getUserId'
import { ConflictException } from '../shared/models/errors/ConflictException'
import { NotFoundException } from '../shared/models/errors/NotFoundException'
import { getAccountsBalance } from '../rapyd/wallet'
import { User } from '../user/models/user'

export const createAccount = async (
  req: Request,
  res: Response<BaseResponse<Account>>,
  next: NextFunction
) => {
  try {
    const { name, assetRafikiId } = await zParse(accountSchema, req)
    const userId = getUserIdFromRequest(req)

    const existentAccount = await Account.query()
      .where('userId', userId)
      .where('name', name)
      .first()
    if (existentAccount) {
      throw new ConflictException(
        `An account with the name '${name}' already exists`
      )
    }

    const asset = await getAsset(assetRafikiId)

    if (!asset) {
      throw new NotFoundException()
    }

    const account = await Account.query().insert({
      name,
      userId,
      assetCode: asset.code,
      assetRafikiId
    })

    const user = await User.query().findById(userId)

    if (!user || !user.rapydEWalletId) {
      throw new NotFoundException()
    }

    const accountsBalance = await getAccountsBalance(user.rapydEWalletId)
    account.balance =
      accountsBalance.data.find((acc) => acc.currency === account.assetCode)
        ?.balance ?? 0

    return res.json({
      success: true,
      message: 'Account created',
      data: account
    })
  } catch (e) {
    next(e)
  }
}
export const listAccounts = async (
  req: Request,
  res: Response<BaseResponse<Account[]>>,
  next: NextFunction
) => {
  try {
    const userId = getUserIdFromRequest(req)
    const accounts = await Account.query().where('userId', userId)

    const user = await User.query().findById(userId)

    if (!user || !user.rapydEWalletId) {
      throw new NotFoundException()
    }

    const accountsBalance = await getAccountsBalance(user.rapydEWalletId)

    accounts.forEach((acc) => {
      acc.balance =
        accountsBalance.data.find(
          (rapydAccount) => rapydAccount.currency === acc.assetCode
        )?.balance ?? 0
    })

    return res.json({ success: true, message: 'Success', data: accounts })
  } catch (e) {
    next(e)
  }
}
export const getAccountById = async (
  req: Request,
  res: Response<BaseResponse<Account>>,
  next: NextFunction
) => {
  try {
    const userId = getUserIdFromRequest(req)
    const accountId = req.params.id
    const account = await findAccountById(accountId, userId)

    const user = await User.query().findById(userId)

    if (!user || !user.rapydEWalletId) {
      throw new NotFoundException()
    }

    const accountsBalance = await getAccountsBalance(user.rapydEWalletId)
    account.balance =
      accountsBalance.data.find((acc) => acc.currency === account.assetCode)
        ?.balance ?? 0

    return res.json({ success: true, message: 'Success', data: account })
  } catch (e) {
    next(e)
  }
}

export const findAccountById = async (
  accountId: string,
  userId: string
): Promise<Account> => {
  const account = await Account.query()
    .findById(accountId)
    .where('userId', userId)

  if (!account) {
    throw new NotFoundException()
  }

  return account
}
