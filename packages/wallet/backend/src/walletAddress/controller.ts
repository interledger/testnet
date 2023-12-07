import { WalletAddress } from '@/walletAddress/model'
import { validate } from '@/shared/validate'
import type { NextFunction, Request } from 'express'
import {
  ExternalWalletAddress,
  WalletAddressList,
  WalletAddressService
} from './service'
import {
  externalWalletAddressSchema,
  walletAddressSchema,
  updateWalletAddressSchema
} from './validation'

interface IWalletAddressController {
  create: ControllerFunction<WalletAddress>
  list: ControllerFunction<WalletAddressList>
  getById: ControllerFunction<WalletAddress>
  softDelete: ControllerFunction
}

interface KeyPair {
  publicKey: string
  privateKey: string
  keyId: string
}

export class WalletAddressController implements IWalletAddressController {
  constructor(private walletAddressService: WalletAddressService) {}

  create = async (
    req: Request,
    res: CustomResponse<WalletAddress>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { accountId } = req.params
      const {
        body: { walletAddressName, publicName, isWM }
      } = await validate(walletAddressSchema, req)

      const walletAddress = await this.walletAddressService.create({
        userId,
        accountId,
        walletAddressName,
        publicName,
        isWM
      })
      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: walletAddress })
    } catch (e) {
      next(e)
    }
  }

  list = async (
    req: Request,
    res: CustomResponse<WalletAddressList>,
    next: NextFunction
  ) => {
    const userId = req.session.user.id
    const { accountId } = req.params

    try {
      const walletAddresses = await this.walletAddressService.list(
        userId,
        accountId
      )
      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: walletAddresses })
    } catch (e) {
      next(e)
    }
  }

  listAll = async (
    req: Request,
    res: CustomResponse<WalletAddress[]>,
    next: NextFunction
  ) => {
    const userId = req.session.user.id

    try {
      const walletAddresses = await this.walletAddressService.listAll(userId)

      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: walletAddresses })
    } catch (e) {
      next(e)
    }
  }

  getExternalWalletAddress = async (
    req: Request,
    res: CustomResponse<ExternalWalletAddress>,
    next: NextFunction
  ) => {
    try {
      const {
        query: { url }
      } = await validate(externalWalletAddressSchema, req)
      const externalWalletAddress =
        await this.walletAddressService.getExternalWalletAddress(url)
      res.status(200).json({
        success: true,
        message: 'SUCCESS',
        data: externalWalletAddress
      })
    } catch (e) {
      next(e)
    }
  }

  getById = async (
    req: Request,
    res: CustomResponse<WalletAddress>,
    next: NextFunction
  ) => {
    const userId = req.session.user.id
    const { accountId, id: walletAddressId } = req.params

    try {
      const walletAddress = await this.walletAddressService.getById({
        userId,
        accountId,
        walletAddressId
      })

      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: walletAddress })
    } catch (e) {
      next(e)
    }
  }

  softDelete = async (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { id } = req.params

      await this.walletAddressService.softDelete(userId, id)

      res.status(200).json({
        success: true,
        message: 'Payment pointer was successfully deleted'
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

      const { privateKey, publicKey, keyId } =
        await this.walletAddressService.registerKey(
          userId,
          accountId,
          walletAddressId
        )

      res.status(200).json({
        success: true,
        message: 'Public key is successfully registered',
        data: { privateKey, publicKey, keyId }
      })
    } catch (e) {
      next(e)
    }
  }

  revokeKey = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const { accountId, walletAddressId } = req.params

      await this.walletAddressService.revokeKey(
        req.session.user.id,
        accountId,
        walletAddressId
      )

      res.status(200).json({
        success: true,
        message: 'Key was successfully revoked.'
      })
    } catch (e) {
      next(e)
    }
  }

  update = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const { accountId, walletAddressId } = req.params

      const {
        body: { publicName }
      } = await validate(updateWalletAddressSchema, req)

      await this.walletAddressService.update({
        userId: req.session.user.id,
        accountId,
        walletAddressId,
        publicName
      })

      res.status(200).json({
        success: true,
        message: 'Payment pointer was successfully updated.'
      })
    } catch (e) {
      next(e)
    }
  }
}
