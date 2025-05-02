import { validate } from '@/shared/validate'
import type { NextFunction, Request } from 'express'
import { KeyResponse, WalletAddressKeyService } from './service'
import {
  batchRevokeWalletAddressKeys,
  generateWalletAddressKey,
  patchWalletAddressKey,
  uploadWalletAddressKey
} from './validation'
import { Controller, toSuccessResponse } from '@shared/backend'
import { WalletAddressKeyResponse } from '@wallet/shared/src/types/WalletAddressKey'

interface IWalletAddressKeyController {
  registerKey: Controller<KeyResponse>
  revokeKey: Controller
  batchRevokeKeys: Controller
  uploadKey: Controller
  patchKey: Controller
  list: Controller<WalletAddressKeyResponse[]>
}

export class WalletAddressKeyController implements IWalletAddressKeyController {
  constructor(private walletAddressKeyService: WalletAddressKeyService) {}

  list = async (
    req: Request,
    res: CustomResponse<WalletAddressKeyResponse[]>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { accountId, walletAddressId } = req.params
      const keys = await this.walletAddressKeyService.listByWalletId({
        userId,
        accountId,
        walletAddressId
      })

      res.status(200).json(toSuccessResponse(keys))
    } catch (e) {
      next(e)
    }
  }

  patchKey = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const userId = req.session.user.id
      const { accountId, walletAddressId, keyId } = req.params
      const {
        body: { nickname }
      } = await validate(patchWalletAddressKey, req)
      await this.walletAddressKeyService.patch({
        userId,
        accountId,
        walletAddressId,
        keyId,
        nickname
      })

      res
        .status(200)
        .json(toSuccessResponse(undefined, 'Public key nickname updated.'))
    } catch (e) {
      next(e)
    }
  }

  registerKey = async (
    req: Request,
    res: CustomResponse<KeyResponse>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { accountId, walletAddressId } = req.params
      const {
        body: { nickname }
      } = await validate(generateWalletAddressKey, req)

      const keyResponse = await this.walletAddressKeyService.registerKey({
        userId,
        accountId,
        walletAddressId,
        nickname
      })

      res
        .status(200)
        .json(
          toSuccessResponse(
            keyResponse,
            'Public key is successfully registered.'
          )
        )
    } catch (e) {
      next(e)
    }
  }

  uploadKey = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const userId = req.session.user.id
      const { accountId, walletAddressId } = req.params
      const {
        body: { nickname, base64Key }
      } = await validate(uploadWalletAddressKey, req)

      await this.walletAddressKeyService.uploadKey({
        userId,
        accountId,
        walletAddressId,
        base64Key,
        nickname
      })

      res
        .status(200)
        .json(
          toSuccessResponse(undefined, 'Public key is successfully uploaded.')
        )
    } catch (e) {
      next(e)
    }
  }

  revokeKey = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const { accountId, walletAddressId, keyId } = req.params

      await this.walletAddressKeyService.revokeKey({
        userId: req.session.user.id,
        accountId,
        walletAddressId,
        keyId
      })

      res
        .status(200)
        .json(
          toSuccessResponse(undefined, 'Public key was successfully revoked.')
        )
    } catch (e) {
      next(e)
    }
  }

  batchRevokeKeys = async (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => {
    try {
      const {
        body: { keys }
      } = await validate(batchRevokeWalletAddressKeys, req)

      await this.walletAddressKeyService.batchRevokeKeys(
        req.session.user.id,
        keys
      )

      res
        .status(200)
        .json(
          toSuccessResponse(undefined, 'Public keys were successfully revoked.')
        )
    } catch (e) {
      next(e)
    }
  }
}
