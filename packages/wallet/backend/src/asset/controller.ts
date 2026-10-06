import { NextFunction, Request } from 'express'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { Controller, toSuccessResponse } from '@shared/backend'
import { AssetResponse } from '@wallet/shared'

interface IAssetController {
  list: Controller<AssetResponse[]>
  listAll: Controller<Pick<AssetResponse, 'code' | 'scale'>[]>
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

  listAll = async (
    _req: Request,
    res: CustomResponse<Pick<AssetResponse, 'code' | 'scale'>[]>,
    next: NextFunction
  ) => {
    try {
      const assets = await this.rafikiClient.listRhyzaAssets()
      res.json(toSuccessResponse(assets))
    } catch (e) {
      next(e)
    }
  }
}
