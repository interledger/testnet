import { zParse } from '../middlewares/validator'
import logger from '../utils/logger'
import { Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'
import { profileSchema, walletSchema } from './schemas/walletSchema'
import {
  createRapydWallet,
  rapydVerifyIdentity,
  updateRapydProfile
} from '../rapyd/wallet'
import { User } from '../user/models/user'
import crypto from 'crypto'
import { kycSchema } from './schemas/kycSchema'
import { NotFoundException } from '../shared/models/errors/NotFoundException'
import { appendAccessTokenToCookie, generateJWT } from '../auth/auth.service'
import { getUserIdFromRequest } from '../utils/getUserId'

const log = logger('WalletService')

export const createWallet = async (
  req: Request,
  res: Response<BaseResponse>
) => {
  try {
    const { id, email } = req.user as User
    const { firstName, lastName, address, city, country, zip, phone } =
      await zParse(walletSchema, req)

    const randomIdentifier = crypto
      .randomBytes(8)
      .toString('base64')
      .slice(0, 8)
    const rapydEWalletReferenceId = `${firstName}-${lastName}-${randomIdentifier}`

    const result = await createRapydWallet({
      first_name: firstName,
      last_name: lastName,
      email,
      ewallet_reference_id: rapydEWalletReferenceId,
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

    const eWallet = result.data
    const user = await User.query().patchAndFetchById(id, {
      firstName: firstName,
      lastName: lastName,
      address: `${address}, ${city}, ${zip}`,
      country,
      rapydEWalletReferenceId: rapydEWalletReferenceId,
      rapydEWalletId: eWallet?.id,
      rapydContactId: eWallet?.contacts?.data[0]?.id
    })

    if (!user) throw new NotFoundException()

    const { accessToken: newAccessToken, expiresIn: accessTokenExpiresIn } =
      generateJWT(user)
    appendAccessTokenToCookie(res, newAccessToken, accessTokenExpiresIn)

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

export const updateProfile = async (
  req: Request,
  res: Response<BaseResponse>
) => {
  try {
    const userId = getUserIdFromRequest(req)
    let user = await User.query().findById(userId)
    if (!user) throw new Error(`user doesn't exist`)
    const { firstName, lastName } = await zParse(profileSchema, req)

    const result = await updateRapydProfile({
      first_name: firstName,
      last_name: lastName,
      ewallet: user.rapydEWalletId
    })

    if (result.status.status !== 'SUCCESS')
      return res.status(500).json({
        message: `Unable to update profile : ${result.status.message}`,
        success: false
      })

    user = await User.query().patchAndFetchById(id, {
      firstName: firstName,
      lastName: lastName,
      rapydEWalletReferenceId: user.rapydEWalletReferenceId
    })

    if (!user) throw new NotFoundException()

    return res
      .status(201)
      .json({ message: 'Success', success: true, data: result.data })
  } catch (error) {
    log.error(error)
    return res
      .status(500)
      .json({ message: 'Unable to update profile', success: false })
  }
}

export const verifyIdentity = async (
  req: Request,
  res: Response<BaseResponse>
) => {
  try {
    const { id } = req.user as User

    const {
      documentType,
      frontSideImage,
      frontSideImageType,
      faceImage,
      faceImageType,
      backSideImage,
      backSideImageType
    } = await zParse(kycSchema, req)

    const user = await User.query().findById(id)
    if (!user) throw new Error(`user doesn't exist`)

    const country = user.country
    if (!country) throw new Error(`country code doesn't exist in database`)

    const values = {
      reference_id: user.rapydEWalletReferenceId,
      ewallet: user.rapydEWalletId,
      country,
      document_type: documentType,
      front_side_image: frontSideImage,
      front_side_image_mime_type: frontSideImageType,
      face_image: faceImage,
      face_image_mime_type: faceImageType,
      back_side_image: backSideImage,
      back_side_image_mime_type: backSideImageType
    }
    const result = await rapydVerifyIdentity(values)

    if (result.status.status !== 'SUCCESS')
      return res.status(500).json({
        message: `Unable to send kyc documents : ${result.status.message}`,
        success: false
      })

    return res
      .status(201)
      .json({ message: 'Success', success: true, data: result.data })
  } catch (error) {
    log.error(error)
    return res
      .status(500)
      .json({ message: 'Unable to send kyc documents', success: false })
  }
}
