import NodeCache from 'node-cache'
import { RatesResponse } from '@wallet/shared'
import { GateHubClient } from '@/gatehub/client'

export interface IRatesService {
  getRates: (base: string) => Promise<RatesResponse>
}

export class RatesService implements IRatesService {
  cache: NodeCache

  constructor(private gateHubClient: GateHubClient) {
    this.cache = new NodeCache({ stdTTL: 60 })
  }

  public async getRates(base: string): Promise<RatesResponse> {
    if (this.cache.has(base)) {
      return {
        base,
        rates: this.cache.get(base) as Record<string, number>
      }
    }

    const result = await this.gateHubClient.getRates(base)
    this.cache.set(base, result)

    return {
      base,
      rates: result ? result : {}
    }
  }
}
