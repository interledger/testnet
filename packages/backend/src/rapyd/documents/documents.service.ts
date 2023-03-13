import logger from '../../utils/logger'
import { Request, Response } from 'express'
import { BaseResponse } from '../../shared/models/BaseResponse'
import { makeRapydGetRequest } from '../utills/request'
import { User } from '../../user/models/user'

const log = logger('rapydService')

export const getDocumentTypes = async (
  req: Request,
  res: Response<BaseResponse>
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
      return res.status(500).json({
        message: `Unable to get document types from rapyd : ${result.status.message}`,
        success: false
      })

    const documentTypes = result.data.map((item: RapydDocumentType) => ({
      type: item.type,
      name: item.name,
      isBackRequired: item.is_back_required
    }))

    return res
      .status(200)
      .json({ message: 'Success', success: true, data: documentTypes })
  } catch (error) {
    log.error(error)
    return res.status(500).json({
      message: 'Unable to get document types from rapyd',
      success: false
    })
  }
}
