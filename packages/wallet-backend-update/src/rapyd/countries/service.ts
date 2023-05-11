/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from 'winston'
import { RapydClient } from '../rapyd-client'

interface RapydCountriesServiceDependencies {
  rapyd: RapydClient
  logger: Logger
}

export class RapydCountriesService {
  constructor(private deps: RapydCountriesServiceDependencies) {}

  public async getCountryNames() {
    const countriesResponse = await this.deps.rapyd.getCountryNames()

    if ((countriesResponse as any).status.status !== 'SUCCESS') {
      //! Thorw
      throw new Error()
    }
    const countryNames = countriesResponse.data.map((i: RapydCountry) => ({
      label: i.name,
      value: i.iso_alpha2
    }))

    return countryNames
  }
}
