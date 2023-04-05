import { NextFunction, Request, Response } from 'express'
import { BaseResponse } from '../../shared/models/BaseResponse'
import { ThirdPartyApiFailedException } from '../../shared/models/errors/ThirdPartyApiFailedException'
import { makeRapydGetRequest } from '../utills/request'

export const getCountryNames = async (
  _: Request,
  res: Response<BaseResponse>,
  next: NextFunction
) => {
  try {
    const result = await makeRapydGetRequest('data/countries')

    if (result.status.status !== 'SUCCESS')
      throw new ThirdPartyApiFailedException(
        'Unable to get country names from rapyd'
      )

    const countryNames = result.data.map((item: RapydCountry) => ({
      name: item.name,
      value: item.iso_alpha2
    }))

    return res
      .status(200)
      .json({ message: 'Success', success: true, data: countryNames })
  } catch (error) {
    next(error)
  }
}
