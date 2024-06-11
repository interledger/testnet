import axios from 'axios'
import NodeCache from 'node-cache'
import { Env } from '@/config/env'
import { Rates as RatesResponse } from '@wallet/shared'

export interface IRatesService {
  getRates: (base: string) => Promise<RatesResponse>
}

export class RatesService implements IRatesService {
  cache: NodeCache

  constructor(private env: Env) {
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
        params: { apikey: this.env.RATE_API_KEY, base_currency: base }
      }
    )

    return response.data.data
  }
}
