import { zParse } from '../middlewares/validator'
import logger from '../utils/logger'
import { Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'
import { walletSchema } from './schemas/walletSchema'
import { createRapydWallet } from '../rapyd/wallet'
import { User } from '../user/models/user'
import crypto from 'crypto'

const log = logger('WalletService')

export const createWallet = async (
  req: Request,
  res: Response<BaseResponse>
) => {
  try {
    const user = req.user as User
    const email = user.email
    const { firstName, lastName, address, city, country, zip, phone } =
      await zParse(walletSchema, req)

    // update address field of user
    await User.query()
      .findOne({ email })
      .patch({
        address: `${address}, ${city}, ${zip}, ${country}`
      })

    const randomIdentifier = crypto
      .randomBytes(8)
      .toString('base64')
      .slice(0, 8)
    const rapydWalletId = `${firstName}-${lastName}-${randomIdentifier}`

    const result = await createRapydWallet({
      first_name: firstName,
      last_name: lastName,
      email,
      ewallet_reference_id: rapydWalletId,
      phone_number: phone,
      type: 'person',
      contact: {
        phone_number: phone,
        email,
        first_name: firstName,
        last_name: lastName,
        contact_type: 'personal',
        address: {
          name: `${firstName} ${lastName}`,
          line_1: address,
          city,
          country,
          zip,
          phone_number: phone
        }
      }
    })

    if (result.status.status !== 'SUCCESS')
      return res.status(500).json({
        message: `Unable to create wallet : ${result.status.message}`,
        success: false
      })

    await User.query().findOne({ email }).patch({
      rapydWalletId
    })

    return res
      .status(201)
      .json({ message: 'Success', success: true, data: result.data })
  } catch (error) {
    log.error(error)
    return res
      .status(500)
      .json({ message: 'Unable to create wallet', success: false })
  }
}
