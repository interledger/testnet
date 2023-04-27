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
type GetAssetResult = SuccessResponse<Asset>
type ListAssetsResponse = ListAssetsResult | ErrorResponse
type GetAssetsResponse = GetAssetResult | ErrorResponse

interface AssetService {
  list: (cookies?: string) => Promise<ListAssetsResponse>
  get: (id: string, cookies?: string) => Promise<GetAssetsResponse>
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

  async get(id, cookies): Promise<GetAssetsResponse> {
    try {
      return await httpClient
        .get(`assets/${id}`, {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<GetAssetResult>()
    } catch (error) {
      return getError(error, 'Unable to fetch assets.')
    }
  }
})

export const assetService = createAssetService()
