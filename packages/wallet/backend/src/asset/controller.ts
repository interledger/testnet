import { NextFunction, Request } from 'express'
import { AssetResponse } from '@wallet/shared'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { Controller, toSuccessResponse } from '@shared/backend'

interface IAssetController {
  list: Controller<AssetResponse[]>
}

export class AssetController implements IAssetController {
  constructor(private rafikiClient: RafikiClient) {}

  list = async (
    _req: Request,
    res: CustomResponse<AssetResponse[]>,
    next: NextFunction
  ) => {
    try {
      const assets = await this.rafikiClient.listAssets({ first: 100 })
      res.json(toSuccessResponse(assets))
    } catch (e) {
      next(e)
    }
  }
}
