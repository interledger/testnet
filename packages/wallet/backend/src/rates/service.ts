import axios from 'axios'
import NodeCache from 'node-cache'
import { Env } from '@/config/env'

export type RatesResponse = {
  base: string
  rates: Record<string, number>
}

export interface IRatesService {
  getRates: (base: string) => Promise<RatesResponse>
}

interface RatesServiceDependencies {
  env: Env
}

export class RatesService implements IRatesService {
  cache: NodeCache

  constructor(private deps: RatesServiceDependencies) {
    this.cache = new NodeCache({ stdTTL: 60 * 60 * 12 })
  }

  public async getRates(base: string): Promise<RatesResponse> {
    if (this.cache.has(base)) {
      return {
        base,
        rates: this.cache.get(base) as Record<string, number>
      }
    }

    const result = await this.getApiRates(base)
    this.cache.set(base, result)

    return {
      base,
      rates: result ? result : {}
    }
  }

  private async getApiRates(base: string): Promise<Record<string, number>> {
    const response = await axios.get(
      'https://api.freecurrencyapi.com/v1/latest',
      {
        params: { apikey: this.deps.env.RATE_API_KEY, base_currency: base }
      }
    )

    return response.data.data
  }
}
