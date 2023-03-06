import { zParse } from '../middlewares/validator'
import logger from '../utils/logger'
import { Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'
import { walletSchema } from './schemas/walletSchema'
import { createRapydWallet } from '../rapyd/wallet'

const log = logger('WalletService')

export const createWallet = async (
  req: Request,
  res: Response<BaseResponse>
) => {
  try {
    const { firstName, lastName, email, address, city, country, zip, phone } =
      await zParse(walletSchema, req)
    const eWalletReferenceId = `${firstName}-${lastName}-402949`

    const result = await createRapydWallet({
      first_name: firstName,
      last_name: lastName,
      email,
      ewallet_reference_id: eWalletReferenceId,
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

    if (result.status.status === 'SUCCESS') {
      return res
        .status(201)
        .json({ message: 'Success', success: true, data: result.data })
    }

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
