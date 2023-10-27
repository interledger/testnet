import { WalletAddress } from '@/walletAddress/model'
import { validate } from '@/shared/validate'
import type { NextFunction, Request } from 'express'
import type { Logger } from 'winston'
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
interface WalletAddressControllerDependencies {
  walletAddressService: WalletAddressService
  logger: Logger
}

interface KeyPair {
  publicKey: string
  privateKey: string
  keyId: string
}

export class WalletAddressController implements IWalletAddressController {
  constructor(private deps: WalletAddressControllerDependencies) {}

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

      const walletAddress = await this.deps.walletAddressService.create({
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
      const walletAddresses = await this.deps.walletAddressService.list(
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
      const walletAddresses =
        await this.deps.walletAddressService.listAll(userId)

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
        await this.deps.walletAddressService.getExternalWalletAddress(url)
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
      const walletAddress = await this.deps.walletAddressService.getById({
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

      await this.deps.walletAddressService.softDelete(userId, id)

      res.status(200).json({
        success: true,
        message: 'Wallet address was successfully deleted'
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
        await this.deps.walletAddressService.registerKey(
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

      await this.deps.walletAddressService.revokeKey(
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

      await this.deps.walletAddressService.update({
        userId: req.session.user.id,
        accountId,
        walletAddressId,
        publicName
      })

      res.status(200).json({
        success: true,
        message: 'Wallet address was successfully updated.'
      })
    } catch (e) {
      next(e)
    }
  }
}
