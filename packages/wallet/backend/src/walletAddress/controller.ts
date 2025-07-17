import { WalletAddress } from '@/walletAddress/model'
import { validate } from '@/shared/validate'
import type { NextFunction, Request } from 'express'
import { WalletAddressService } from './service'
import {
  externalWalletAddressSchema,
  walletAddressSchema,
  updateWalletAddressSchema
} from './validation'
import { Controller, toSuccessResponse } from '@shared/backend'
import { WalletAddressOP, WalletAddressResponse } from '@wallet/shared'

interface IWalletAddressController {
  create: Controller<WalletAddress>
  list: Controller<WalletAddress[]>
  getById: Controller<WalletAddress>
  softDelete: Controller
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
        body: { walletAddressName, publicName }
      } = await validate(walletAddressSchema, req)

      const walletAddress = await this.walletAddressService.create({
        userId,
        accountId,
        walletAddressName,
        publicName
      })
      res.status(200).json(toSuccessResponse(walletAddress))
    } catch (e) {
      next(e)
    }
  }

  list = async (
    req: Request,
    res: CustomResponse<WalletAddress[]>,
    next: NextFunction
  ) => {
    const userId = req.session.user.id
    const { accountId } = req.params

    try {
      const walletAddresses = await this.walletAddressService.list(
        userId,
        accountId
      )
      res.status(200).json(toSuccessResponse(walletAddresses))
    } catch (e) {
      next(e)
    }
  }

  listAll = async (
    req: Request,
    res: CustomResponse<WalletAddressResponse[]>,
    next: NextFunction
  ) => {
    const userId = req.session.user.id

    try {
      const walletAddresses = await this.walletAddressService.listAll(userId)

      res.status(200).json(toSuccessResponse(walletAddresses))
    } catch (e) {
      next(e)
    }
  }

  getExternalWalletAddress = async (
    req: Request,
    res: CustomResponse<WalletAddressOP>,
    next: NextFunction
  ) => {
    try {
      const {
        query: { url }
      } = await validate(externalWalletAddressSchema, req)
      const externalWalletAddress =
        await this.walletAddressService.getExternalWalletAddress(url)
      res.status(200).json(toSuccessResponse(externalWalletAddress))
    } catch (e) {
      next(e)
    }
  }

  getById = async (
    req: Request,
    res: CustomResponse<WalletAddressResponse>,
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

      res.status(200).json(toSuccessResponse(walletAddress))
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

      res
        .status(200)
        .json(
          toSuccessResponse(
            undefined,
            'Wallet address was successfully deleted.'
          )
        )
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

      res
        .status(200)
        .json(
          toSuccessResponse(
            undefined,
            'Wallet address was successfully updated.'
          )
        )
    } catch (e) {
      next(e)
    }
  }
}
