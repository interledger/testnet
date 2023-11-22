import { NextFunction, Request } from 'express'
import { Asset } from '@/rafiki/backend/generated/graphql'
import { RafikiClient } from '@/rafiki/rafiki-client'

interface IAssetController {
  list: ControllerFunction<Asset[]>
}

export class AssetController implements IAssetController {
  constructor(private rafikiClient: RafikiClient) {}

  list = async (
    _req: Request,
    res: CustomResponse<Asset[]>,
    next: NextFunction
  ) => {
    try {
      const assets = await this.rafikiClient.listAssets({ first: 100 })
      res.json({ success: true, message: 'Success', data: assets })
    } catch (e) {
      next(e)
    }
  }
}
