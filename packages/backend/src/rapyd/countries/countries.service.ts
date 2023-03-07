import logger from '../../utils/logger'
import { Request, Response } from 'express'
import { BaseResponse } from '../../shared/models/BaseResponse'
import { makeRapydGetRequest } from '../utills/request'

const log = logger('rapydService')

export const getCountryNames = async (
  _: Request,
  res: Response<BaseResponse>
) => {
  try {
    const result = await makeRapydGetRequest('data/countries')

    if (result.status.status !== 'SUCCESS')
      throw new Error(result.status.message)

    const countryNames = result.data.map((item: RapydCountry) => ({
      name: item.name,
      value: item.iso_alpha2
    }))

    return res
      .status(200)
      .json({ message: 'Success', success: true, data: countryNames })
  } catch (error) {
    log.error(error)
    return res.status(500).json({
      message: 'Unable to get country names from rapyd',
      success: false
    })
  }
}
