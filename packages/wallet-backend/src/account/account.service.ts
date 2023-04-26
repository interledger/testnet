import { NextFunction, Request, Response } from 'express'
import { zParse } from '../middlewares/validator'
import { getAsset } from '../rafiki/request/asset.request'
import {
  completePayout,
  getPayoutMethodTypes,
  getPayoutTypeRequiredFields,
  issueVirtualAccount,
  simulateBankTransferToWallet,
  withdrawFundsFromWalletAccount
} from '../rapyd/virtual-accounts'
import { getRapydAccountsList } from '../rapyd/wallet'
import { BaseResponse } from '../shared/models/BaseResponse'
import { ConflictException } from '../shared/models/errors/ConflictException'
import { NotFoundException } from '../shared/models/errors/NotFoundException'
import { User } from '../user/models/user'
import { getUserIdFromRequest } from '../utils/getUserId'
import { formatBalance } from '../utils/helpers'
import { Account } from './account.model'
import { accountSchema, accountFundsSchema } from './schemas/account.schema'

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
      .where('userId', userId)
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
      rapydVirtualBankAccountId: virtualAccount.id
    })

    await simulateBankTransferToWallet({
      amount: 0,
      currency: account.assetCode,
      issued_bank_account: account.rapydVirtualBankAccountId
    })

    if (!user || !user.rapydEWalletId) {
      throw new NotFoundException()
    }

    const rapydAccounts = await getRapydAccountsList(user.rapydEWalletId)
    account.balance = formatBalance(
      rapydAccounts.data.find(
        (rapydAccount) => rapydAccount.currency === account.assetCode
      )?.balance ?? 0
    )

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

    const rapydAccounts = await getRapydAccountsList(user.rapydEWalletId)

    accounts.forEach((acc) => {
      acc.balance = formatBalance(
        rapydAccounts.data.find(
          (rapydAccount) => rapydAccount.currency === acc.assetCode
        )?.balance ?? 0
      )
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

    account.balance = await getAccountBalance(userId, account.assetCode)

    return res.json({ success: true, message: 'Success', data: account })
  } catch (e) {
    next(e)
  }
}

export async function getAccountBalance(
  userId: string,
  assetCode: string
): Promise<string> {
  const user = await User.query().findById(userId)

  if (!user || !user.rapydEWalletId) {
    throw new NotFoundException()
  }

  const rapydAccounts = await getRapydAccountsList(user.rapydEWalletId)
  return formatBalance(
    rapydAccounts.data.find(
      (rapydAccount) => rapydAccount.currency === assetCode
    )?.balance ?? 0
  )
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
    const { amount, assetCode } = await zParse(accountFundsSchema, req)

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
      issued_bank_account: existingAccount.rapydVirtualBankAccountId
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

export const withdrawFunds = async (
  req: Request,
  res: Response<BaseResponse>,
  next: NextFunction
) => {
  try {
    const { amount, assetCode } = await zParse(accountFundsSchema, req)

    const userId = getUserIdFromRequest(req)
    const existingAccount = await Account.query()
      .where('userId', userId)
      .where('assetCode', assetCode)
      .first()
    if (!existingAccount) {
      throw new NotFoundException()
    }

    // get list of payout method types for currency
    const payoutType = await getPayoutMethodTypes({
      currency: assetCode
    })

    if (
      payoutType.status.status !== 'SUCCESS' &&
      payoutType.data[0] === undefined
    ) {
      return res.status(500).json({
        message: `Unable to withdraw funds from your account. ${payoutType.status.message}`,
        success: false
      })
    }

    const user = await User.query().findById(userId)
    if (!user) {
      throw new NotFoundException()
    }

    const payoutMethodType = payoutType.data[0].payout_method_type
    // get payout type required fields, will be needed in production
    const payoutRequiredFields = await getPayoutTypeRequiredFields({
      payout_method_type: payoutMethodType ?? '',
      country: user.country ?? '',
      currency: assetCode,
      payout_amount: amount
    })

    if (payoutRequiredFields.status.status !== 'SUCCESS') {
      return res.status(500).json({
        message: `Unable to withdraw funds from your account. ${payoutRequiredFields.status.message}`,
        success: false
      })
    }

    // withdraw funds/create payout from wallet account into bank account
    const userDetails = {
      name: `${user.firstName} ${user.lastName}`,
      address: user.address ?? ''
    }
    const payout = await withdrawFundsFromWalletAccount({
      beneficiary: userDetails,
      payout_amount: amount,
      payout_currency: assetCode,
      ewallet: user.rapydEWalletId ?? '',
      sender: userDetails,
      sender_country: user.country ?? '',
      sender_currency: assetCode,
      beneficiary_entity_type: 'individual',
      sender_entity_type: 'individual',
      payout_method_type: payoutMethodType
    })

    if (payout.status.status !== 'SUCCESS') {
      return res.status(500).json({
        message: `Unable to withdraw funds from your account. ${payout.status.message}`,
        success: false
      })
    }

    // complete third party/bank payout
    const completePayoutResponse = await completePayout({
      payout: payout.data.id,
      amount: amount
    })
    if (completePayoutResponse.status.status !== 'SUCCESS') {
      return res.status(500).json({
        message: `Unable to withdraw funds from your account. ${completePayoutResponse.status.message}`,
        success: false
      })
    }

    return res.json({
      success: true,
      message: 'Funds withdrawn'
    })
  } catch (e) {
    next(e)
  }
}
