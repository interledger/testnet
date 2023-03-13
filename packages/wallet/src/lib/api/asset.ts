import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'

export type Asset = {
  id: string
  code: string
  scale: number
  withdrawalThreshold?: bigint
  createdAt: string
}

type ListAssetsResult = SuccessResponse<Asset[]>
type ListAssetsResponse = Promise<ListAssetsResult | ErrorResponse>

interface AssetService {
  list: (cookies?: string) => Promise<ListAssetsResponse>
}

const createAssetService = (): AssetService => ({
  async list(cookies): Promise<ListAssetsResponse> {
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
  }
})

export const assetService = createAssetService()
