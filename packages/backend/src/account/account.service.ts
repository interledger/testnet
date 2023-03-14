import { NextFunction, Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'
import { zParse } from '../middlewares/validator'
import { accountSchema, fundSchema } from './schemas/account.schema'
import { getAsset } from '../rafiki/request/asset.request'
import { Account } from './account.model'
import { getUserIdFromRequest } from '../utils/getUserId'
import { ConflictException } from '../shared/models/errors/ConflictException'
import { NotFoundException } from '../shared/models/errors/NotFoundException'
import { User } from '../user/models/user'
import {
  issueVirtualAccount,
  simulateBankTransferToWallet
} from '../rapyd/virtual-accounts'

export const createAccount = async (
  req: Request,
  res: Response<BaseResponse<Account>>,
  next: NextFunction
) => {
  try {
    const { name, assetRafikiId } = await zParse(accountSchema, req)
    const userId = getUserIdFromRequest(req)

    const existingAccount = await Account.query()
      .where('userId', userId)
      .where('name', name)
      .first()
    if (existingAccount) {
      throw new ConflictException(
        `An account with the name '${name}' already exists`
      )
    }

    const asset = await getAsset(assetRafikiId)
    if (!asset) {
      throw new NotFoundException()
    }
    const existingAsset = await Account.query()
      .where('assetCode', asset.code)
      .first()
    if (existingAsset) {
      throw new ConflictException(
        `An account with the same asset ${asset.code} already exists`
      )
    }

    // issue virtual account to wallet
    const user = await User.query().findById(userId)
    if (!user) {
      throw new NotFoundException()
    }

    const result = await issueVirtualAccount({
      country: user.country ?? '',
      currency: asset.code,
      ewallet: user.rapydEWalletId ?? ''
    })

    if (result.status.status !== 'SUCCESS') {
      return res.status(500).json({
        message: `Unable to issue virtal account to ewallet: ${result.status.message}`,
        success: false
      })
    }

    // save virtual bank account number to database
    const virtualAccount = result.data

    const account = await Account.query().insert({
      name,
      userId,
      assetCode: asset.code,
      assetRafikiId,
      rapydAccountId: virtualAccount.id
    })

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

export const fundAccount = async (
  req: Request,
  res: Response<BaseResponse>,
  next: NextFunction
) => {
  try {
    const { amount, assetCode } = await zParse(fundSchema, req)

    const userId = getUserIdFromRequest(req)
    const existingAccount = await Account.query()
      .where('userId', userId)
      .where('assetCode', assetCode)
      .first()
    if (!existingAccount) {
      throw new NotFoundException()
    }

    // fund amount to wallet account
    const result = await simulateBankTransferToWallet({
      amount: amount,
      currency: assetCode,
      issued_bank_account: existingAccount.rapydAccountId
    })

    if (result.status.status !== 'SUCCESS') {
      return res.status(500).json({
        message: `Unable to fund your account: ${result.status.message}`,
        success: false
      })
    }

    return res.json({
      success: true,
      message: 'Account funded'
    })
  } catch (e) {
    next(e)
  }
}
