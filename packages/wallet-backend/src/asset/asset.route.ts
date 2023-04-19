import express from 'express'
import passport from 'passport'
import {
  create,
  getById as getAssetById,
  list as listAsset
} from './asset.service'

export const assetRouter = express.Router()

//* Testing purpose: In order to properly create assets from postman
assetRouter.post('', create)
assetRouter.get('', passport.authenticate('jwt', { session: false }), listAsset)
assetRouter.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  getAssetById
)
