import { Logger } from 'winston'
import { CountriesService } from './service'
import { NextFunction, Request } from 'express'

interface IRapydCountriesController {
  getCountryNames: (
    _: Request,
    res: CustomResponse,
    next: NextFunction
  ) => Promise<void>
}
interface RapydCountriesDependencies {
  logger: Logger
  countriesService: CountriesService
}

export class RapydCountriesController implements IRapydCountriesController {
  constructor(private deps: RapydCountriesDependencies) {}

  public async getCountryNames(
    _: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) {
    try {
      const countryNamesResult =
        await this.deps.countriesService.getCountryNames()
      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: countryNamesResult })
    } catch (e) {
      next(e)
    }
  }
}
