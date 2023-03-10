import express from 'express'
import passport from 'passport'
import { getById as getAssetById, list as listAsset } from './asset.service'

export const assetRouter = express.Router()

assetRouter.get('', passport.authenticate('jwt', { session: false }), listAsset)
assetRouter.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  getAssetById
)
