import {
  type ErrorResponse,
  getError,
  httpClient,
  type SuccessResponse
} from '../httpClient'

export type Asset = {
  id: string
  code: string
  scale: number
  withdrawalThreshold?: bigint
  createdAt: string
}

export type Rates = {
  base: string
  rates: Record<string, number>
}

type ListAssetsResult = SuccessResponse<Asset[]>
type ListAssetsResponse = ListAssetsResult | ErrorResponse

type ExchangeRateResponse = Rates | ErrorResponse

interface AssetService {
  list: (cookies?: string) => Promise<ListAssetsResponse>
  exchangeRates: (
    assetCode: string,
    cookies?: string
  ) => Promise<ExchangeRateResponse>
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

  async exchangeRates(assetCode, cookies) {
    try {
      const response = await httpClient
        .get(`rates?base=${assetCode}`, {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<Rates>()
      return response
    } catch (error) {
      return getError(error, 'Unable to get exchange rates.')
    }
  }
})

const assetService = createAssetService()
export { assetService }
