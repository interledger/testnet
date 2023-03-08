import logger from '../../utils/logger'
import { Request, Response } from 'express'
import { BaseResponse } from '../../shared/models/BaseResponse'
import { makeRapydGetRequest } from '../utills/request'

const log = logger('rapydService')

export const getDocumentTypes = async (
  req: Request,
  res: Response<BaseResponse>
) => {
  try {
    const { country } = req.query
    const result = await makeRapydGetRequest(
      `identities/types?country=${country}`
    )

    if (result.status.status !== 'SUCCESS')
      return res.status(500).json({
        message: `Unable to get document types from rapyd : ${result.status.message}`,
        success: false
      })

    const documentTypes = result.data.map((item: RapydCountry) => ({
      name: item.name,
      value: item.iso_alpha2
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
