import { NextFunction, Request } from 'express'
import { RhyzaAdminClient } from '@/rhyza/admin-client'
import { Controller, toSuccessResponse } from '@shared/backend'
import { AssetResponse } from '@wallet/shared'

interface IAssetController {
  list: Controller<Pick<AssetResponse, 'code' | 'scale'>[]>
}

export class AssetController implements IAssetController {
  constructor(private rhyzaAdminClient: RhyzaAdminClient) {}

  list = async (
    _req: Request,
    res: CustomResponse<Pick<AssetResponse, 'code' | 'scale'>[]>,
    next: NextFunction
  ) => {
    try {
      const assets = await this.rhyzaAdminClient.listAssets()
      res.json(toSuccessResponse(assets))
    } catch (e) {
      next(e)
    }
  }
}
