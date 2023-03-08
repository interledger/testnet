import { NextFunction, Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'
import { zParse } from '../middlewares/validator'
import { accountSchema } from './schemas/account.schema'
import { getAsset } from '../rafiki/request/asset.request'
import { Account } from './account.model'
import { getUserIdFromRequest } from '../utils/getUserId'
import { AccountExistsException } from './errors/AccountExistsException'

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
      new AccountExistsException(name)
    }

    const asset = await getAsset(assetRafikiId)

    const account = await Account.query().insert({
      name,
      userId,
      assetCode: asset.code,
      assetRafikiId
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
    const account = await Account.query()
      .findById(accountId)
      .where('userId', userId)
      .throwIfNotFound()
    return res.json({ success: true, message: 'Success', data: account })
  } catch (e) {
    next(e)
  }
}
