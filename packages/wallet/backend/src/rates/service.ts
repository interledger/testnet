import axios from 'axios'
import NodeCache from 'node-cache'

export type RatesResponse = {
  base: string
  rates: Record<string, number>
}

export interface IRatesService {
  getRates: (base: string) => Promise<RatesResponse>
}

export class RatesService implements IRatesService {
  cache: NodeCache

  constructor() {
    this.cache = new NodeCache({ stdTTL: 60 * 60 * 12 })
  }

  public async getRates(base: string): Promise<RatesResponse> {
    if (this.cache.has(base)) {
      return {
        base,
        rates: this.cache.get(base) as Record<string, number>
      }
    }

    const res = await axios.get('https://api.exchangerate.host/latest', {
      params: { base }
    })
    const result = res.data
    this.cache.set(base, result)

    return {
      base,
      rates: result.success ? result.rates : {}
    }
  }
}
