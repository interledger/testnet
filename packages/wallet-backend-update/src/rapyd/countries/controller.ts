import { Logger } from 'winston'
import { NextFunction, Request } from 'express'
import { RapydCountriesService } from './service'

interface IRapydCountriesController {
  getCountryNames: (
    _: Request,
    res: CustomResponse,
    next: NextFunction
  ) => Promise<void>
}
interface RapydCountriesDependencies {
  logger: Logger
  rapydCountriesService: RapydCountriesService
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
        await this.deps.rapydCountriesService.getCountryNames()
      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: countryNamesResult })
    } catch (e) {
      next(e)
    }
  }
}
