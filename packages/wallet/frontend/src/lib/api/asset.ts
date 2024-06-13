import {
  type ErrorResponse,
  getError,
  httpClient,
  type SuccessResponse
} from '../httpClient'
import { AssetResponse, RatesResponse } from '@wallet/shared'

export type ExchangeRates = Record<string, number>

type ListAssetsResult = SuccessResponse<AssetResponse[]>
type ListAssetsResponse = ListAssetsResult | ErrorResponse

type GetExchangeRatesResponse = SuccessResponse<ExchangeRates> | ErrorResponse

interface AssetService {
  list: (cookies?: string) => Promise<ListAssetsResponse>
  getExchangeRates: (assetCode: string) => Promise<GetExchangeRatesResponse>
}

const createAssetService = (): AssetService => ({
  async list(cookies) {
    try {
      const response = await httpClient
        .get('assets', {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<ListAssetsResult>()
      return response
    } catch (error) {
      return getError(error, 'Unable to fetch assets.')
    }
  },

  async getExchangeRates(assetCode) {
    try {
      const response = await httpClient
        .get(`rates?base=${assetCode}`)
        .json<RatesResponse>()

      const rates = {
        [response.base]: 1,
        ...response.rates
      }

      return {
        success: true,
        message: 'SUCCESS',
        result: rates
      }
    } catch (error) {
      return getError(error, 'Unable to get exchange rates.')
    }
  }
})

const assetService = createAssetService()
export { assetService }
