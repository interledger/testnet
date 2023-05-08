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

type ListAssetsResult = SuccessResponse<Asset[]>
type ListAssetsResponse = ListAssetsResult | ErrorResponse

type GetAssetResult = SuccessResponse<Asset>
type GetAssetResponse = GetAssetResult | ErrorResponse

interface AssetService {
  list: (cookies?: string) => Promise<ListAssetsResponse>
  get: (id: string, cookies?: string) => Promise<GetAssetResponse>
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
  },

  async get(id, cookies): Promise<GetAssetResponse> {
    try {
      return await httpClient
        .get(`assets/${id}`, {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<GetAssetResult>()
    } catch (error) {
      return getError(error, 'Unable to fetch asset.')
    }
  }
})

export const assetService = createAssetService()
