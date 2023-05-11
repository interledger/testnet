/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction } from 'express'
import { Logger } from 'winston'
import { NotFound } from '../errors'
import { Asset } from '../rafiki/generated/graphql'
import { RafikiClient } from '../rafiki/rafiki-client'

interface IAssetController {
  list: (
    req: Request,
    res: CustomResponse<Asset[]>,
    next: NextFunction
  ) => Promise<void>
  getById: (
    req: Request,
    res: CustomResponse<Asset>,
    next: NextFunction
  ) => Promise<void>
}
interface AssetControllerDependencies {
  logger: Logger
  rafikiClient: RafikiClient
}

export class AssetController implements IAssetController {
  constructor(private deps: AssetControllerDependencies) {}
  public async list(
    _req: Request,
    res: CustomResponse<Asset[]>,
    next: NextFunction
  ) {
    try {
      const assets = await this.deps.rafikiClient.listAssets()
      res.json({ success: true, message: 'Success', data: assets })
    } catch (e) {
      next(e)
    }
  }

  public async getById(
    req: Request,
    res: CustomResponse<Asset>,
    next: NextFunction
  ) {
    try {
      //! TODO: change  req.params.id
      const asset = await this.deps.rafikiClient.getAssetById(
        (req as any).params.id
      )

      if (!asset) {
        throw new NotFound()
      }

      res.json({ success: true, message: 'Success', data: asset })
    } catch (e) {
      next(e)
    }
  }
}
