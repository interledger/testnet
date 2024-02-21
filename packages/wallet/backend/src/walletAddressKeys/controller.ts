import { validate } from '@/shared/validate'
import type { NextFunction, Request } from 'express'
import { KeyResponse, WalletAddressKeyService } from './service'
import {
  generateWalletAddressKey,
  patchWalletAddressKey,
  uploadWalletAddressKey
} from './validation'
import { WalletAddressKeys } from '@/walletAddressKeys/model'

interface IWalletAddressKeyController {
  registerKey: ControllerFunction<KeyResponse>
  revokeKey: ControllerFunction
  uploadKey: ControllerFunction
  patchKey: ControllerFunction
  list: ControllerFunction<WalletAddressKeys[]>
}

interface KeyPair {
  publicKey: string
  privateKey: string
  keyId: string
}

export class WalletAddressKeyController implements IWalletAddressKeyController {
  constructor(private walletAddressKeyService: WalletAddressKeyService) {}

  list = async (
    req: Request,
    res: CustomResponse<WalletAddressKeys[]>,
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

      res.status(200).json({
        success: true,
        message: 'SUCCESS',
        result: keys
      })
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

      res.status(200).json({
        success: true,
        message: 'Public key nickname updated.'
      })
    } catch (e) {
      next(e)
    }
  }

  registerKey = async (
    req: Request,
    res: CustomResponse<KeyPair>,
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

      res.status(200).json({
        success: true,
        message: 'Public key is successfully registered.',
        result: keyResponse
      })
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

      res.status(200).json({
        success: true,
        message: 'Public key is successfully uploaded.'
      })
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

      res.status(200).json({
        success: true,
        message: 'Public key was successfully revoked.'
      })
    } catch (e) {
      next(e)
    }
  }
}
