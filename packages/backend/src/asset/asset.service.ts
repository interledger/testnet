import { NextFunction, Request, Response } from 'express'
import { BaseResponse } from '../shared/models/BaseResponse'
import { zParse } from '../middlewares/validator'
import { assetSchema } from './schemas/asset.schema'
import type { Asset, CreateAssetMutation } from '../rafiki/generated/graphql'
import {
  createAsset,
  getAsset,
  listAssets
} from '../rafiki/request/asset.request'
import { NotFoundException } from '../shared/models/errors/NotFoundException'

export const create = async (
  req: Request,
  res: Response<BaseResponse<CreateAssetMutation['createAsset']['asset']>>,
  next: NextFunction
) => {
  try {
    const { scale, code } = await zParse(assetSchema, req)
    const asset = await createAsset(code, scale)
    return res.json({ success: true, message: 'Asset created', data: asset })
  } catch (e) {
    next(e)
  }
}

export const list = async (
  _req: Request,
  res: Response<BaseResponse<Asset[]>>,
  next: NextFunction
) => {
  try {
    const assets = await listAssets()
    return res.json({ success: true, message: 'Success', data: assets })
  } catch (e) {
    next(e)
  }
}

export const getById = async (
  req: Request,
  res: Response<BaseResponse<Asset>>,
  next: NextFunction
) => {
  try {
    const asset = await getAsset(req.params.id)
    if (!asset) {
      throw new NotFoundException()
    }

    return res.json({ success: true, message: 'Success', data: asset })
  } catch (e) {
    next(e)
  }
}
