import { NextFunction, Request, Response } from 'express'
import { BaseResponse } from '../../shared/models/BaseResponse'
import { makeRapydGetRequest } from '../utills/request'
import { User } from '../../user/models/user'
import { ThirdPartyApiFailedException } from '../../shared/models/errors/ThirdPartyApiFailedException'

export const getDocumentTypes = async (
  req: Request,
  res: Response<BaseResponse>,
  next: NextFunction
) => {
  try {
    const { email } = req.user as User

    const user = await User.query().where('email', email).first()
    if (!user) throw new Error(`user doesn't exist`)

    const country = user.country
    if (!country) throw new Error(`country code doesn't exist in database`)

    const result = await makeRapydGetRequest(
      `identities/types?country=${country}`
    )

    if (result.status.status !== 'SUCCESS')
      throw new ThirdPartyApiFailedException(
        'Unable to get document types from rapid'
      )

    const documentTypes = result.data.map((item: RapydDocumentType) => ({
      type: item.type,
      name: item.name,
      isBackRequired: item.is_back_required
    }))

    return res
      .status(200)
      .json({ message: 'Success', success: true, data: documentTypes })
  } catch (error) {
    next(error)
  }
}
