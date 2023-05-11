/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request } from 'express'
import type { Logger } from 'winston'
import { WalletService } from './service'
import { User } from '../../user/model'
import { validate } from '../../shared/validate'
import { walletSchema } from './schemas/wallet.schema'
import { kycSchema } from './schemas/kyc.schema'
import { profileSchema } from './schemas/profile.schema'

interface IRapydWalletController {
  createWallet: (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => Promise<void>
  verifyIdentity: (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => Promise<void>
  updateProfile: (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => Promise<void>
}
interface RapydWalletControllerDependencies {
  logger: Logger
  walletService: WalletService
}

export class RapydWalletController implements IRapydWalletController {
  constructor(private deps: RapydWalletControllerDependencies) {}

  public async createWallet(
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) {
    const { id, email } = (req as any).user as User

    try {
      const { firstName, lastName, address, city, country, zip, phone } =
        await validate(walletSchema, req)

      const createWalletResponse = this.deps.walletService.createWallet(
        firstName,
        lastName,
        address,
        city,
        country,
        zip,
        email,
        id,
        phone
      )

      res.status(200).json({
        success: true,
        message: 'Wallet created succesfully',
        data: createWalletResponse
      })
    } catch (e) {
      next(e)
    }
  }

  public async verifyIdentity(
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) {
    const { id: userId } = (req as any).user as User

    try {
      const {
        documentType,
        frontSideImage,
        frontSideImageType,
        faceImage,
        faceImageType,
        backSideImage,
        backSideImageType
      } = await validate(kycSchema, req)

      const verifyIdentityResponse = this.deps.walletService.verifyIdentity(
        userId,
        documentType,
        frontSideImage,
        frontSideImageType,
        faceImage,
        faceImageType,
        backSideImage,
        backSideImageType
      )

      res.status(200).json({
        success: true,
        message: 'Wallet created succesfully',
        data: verifyIdentityResponse
      })
    } catch (e) {
      next(e)
    }
  }

  public async updateProfile(
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) {
    const { id: userId } = (req as any).user as User

    try {
      const { firstName, lastName } = await validate(profileSchema, req)

      const updateProfileResponse = await this.deps.walletService.updateProfile(
        userId,
        firstName,
        lastName
      )

      res.status(200).json({
        success: true,
        message: 'Wallet created succesfully',
        data: updateProfileResponse
      })
      return updateProfileResponse
    } catch (e) {
      next(e)
    }
  }
}
