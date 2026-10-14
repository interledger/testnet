import { RhyzaAdminClient } from '@/rhyza/admin-client'
import { Asset } from '@/rhyza/types'
import { NotFound } from '@shared/backend'

interface IAssetService {
  getAssetByCode: (assetCode: string, scale?: number) => Promise<Asset>
}

export class AssetService implements IAssetService {
  constructor(private rhyzaAdminClient: RhyzaAdminClient) {}

  async getAssetByCode(assetCode: string, scale?: number): Promise<Asset> {
    const assets = await this.rhyzaAdminClient.listAssets()
    const asset = assets.find(
      scale
        ? (asset) => asset.code === assetCode && asset.scale === scale
        : (asset) => asset.code === assetCode
    )
    if (!asset) {
      throw new NotFound(`Asset ${assetCode} not found`)
    }
    return asset
  }
}
