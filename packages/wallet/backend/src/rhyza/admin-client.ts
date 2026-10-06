import { HttpClient } from '@/rhyza/http-client'
import { Asset } from '@/rhyza/types'

interface AssetCreateResponse {
  code: string
}

export class RhyzaAdminClient {
  constructor(private http: HttpClient) {}

  async createAsset(code: string, scale: number): Promise<Asset> {
    const response = await this.http.post<AssetCreateResponse>('/assets', {
      code,
      scale
    })
    // The response echoes only the code.
    return { code: response.code, scale }
  }
}
