import axios from 'axios'

export interface IRatesService {
  getRates: (userId: string) => Promise<RatesResponse>
}

export class RatesService implements IRatesService {
  public async getRates(base: string): Promise<RatesResponse> {
    const res = await axios.get('https://api.exchangerate.host/latest', {
      params: { base }
    })
    const result = res.data

    return {
      base,
      rates: result.success ? result.rates : {}
    }
  }
}
