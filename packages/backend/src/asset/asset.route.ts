import express from 'express'
import passport from 'passport'
import {
  getById as getAssetById,
  list as listAsset,
  create
} from './asset.service'

export const assetRouter = express.Router()

assetRouter.get('', passport.authenticate('jwt', { session: false }), listAsset)
assetRouter.post('', passport.authenticate('jwt', { session: false }), create)
assetRouter.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  getAssetById
)
