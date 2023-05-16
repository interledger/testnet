/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request } from 'express'
import { Logger } from 'winston'
import { validate } from '../shared/validate'
import { User } from '../user/model'
import { RapydService } from './service'
import { kycSchema, profileSchema, walletSchema } from './validation'

interface IRapydController {
  getCountryNames: ControllerFunction
  getDocumentTypes: ControllerFunction
  createWallet: ControllerFunction
  verifyIdentity: ControllerFunction
  updateProfile: ControllerFunction
}
interface RapydControllerDependencies {
  logger: Logger
  rapydService: RapydService
}

export class RapydController implements IRapydController {
  constructor(private deps: RapydControllerDependencies) {}

  public async getCountryNames(
    _: Request,
    res: CustomResponse,
    next: NextFunction
  ) {
    try {
      const countryNamesResult = await this.deps.rapydService.getCountryNames()
      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: countryNamesResult })
    } catch (e) {
      next(e)
    }
  }

  public async getDocumentTypes(
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) {
    try {
      const { id: userId } = (req as any).user as User

      const documentTypesResult = await this.deps.rapydService.getDocumentTypes(
        userId
      )
      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: documentTypesResult })
    } catch (e) {
      next(e)
    }
  }

  public async createWallet(
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) {
    const { id, email } = (req as any).user as User

    try {
      const { firstName, lastName, address, city, country, zip, phone } =
        await validate(walletSchema, req)

      const createWalletResponse = this.deps.rapydService.createWallet({
        firstName,
        lastName,
        address,
        city,
        country,
        zip,
        email,
        id,
        phone
      })

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

      const verifyIdentityResponse = this.deps.rapydService.verifyIdentity({
        userId,
        documentType,
        frontSideImage,
        frontSideImageType,
        faceImage,
        faceImageType,
        backSideImage,
        backSideImageType
      })

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

      const updateProfileResponse = await this.deps.rapydService.updateProfile(
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
