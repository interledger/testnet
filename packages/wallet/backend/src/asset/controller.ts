import { NextFunction, Request } from 'express'
import { Logger } from 'winston'
import { Asset } from '@/rafiki/generated/graphql'
import { RafikiClient } from '@/rafiki/rafiki-client'

interface IAssetController {
  list: ControllerFunction<Asset[]>
}
interface AssetControllerDependencies {
  logger: Logger
  rafikiClient: RafikiClient
}

export class AssetController implements IAssetController {
  constructor(private deps: AssetControllerDependencies) {}

  list = async (
    _req: Request,
    res: CustomResponse<Asset[]>,
    next: NextFunction
  ) => {
    try {
      const assets = await this.deps.rafikiClient.listAssets()
      res.json({ success: true, message: 'Success', data: assets })
    } catch (e) {
      next(e)
    }
  }
}
