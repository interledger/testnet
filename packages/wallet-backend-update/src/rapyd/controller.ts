import { NextFunction, Request } from 'express'
import { Logger } from 'winston'
import { validate } from '@/shared/validate'
import { RapydService } from './service'
import { kycSchema, profileSchema, walletSchema } from './validation'

interface IRapydController {
  getCountryNames: ControllerFunction<{ label?: string; value?: string }[]>
  getDocumentTypes: ControllerFunction<RapydDocumentType[]>
  createWallet: ControllerFunction<RapydWallet>
  verifyIdentity: ControllerFunction<RapydIdentityResponse>
  updateProfile: ControllerFunction<RapydWallet>
}
interface RapydControllerDependencies {
  logger: Logger
  rapydService: RapydService
}

export class RapydController implements IRapydController {
  constructor(private deps: RapydControllerDependencies) {}

  public getCountryNames = async (
    _: Request,
    res: CustomResponse<{ label?: string; value?: string }[]>,
    next: NextFunction
  ) => {
    try {
      const countryNamesResult = await this.deps.rapydService.getCountryNames()
      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: countryNamesResult })
    } catch (e) {
      next(e)
    }
  }

  public getDocumentTypes = async (
    req: Request,
    res: CustomResponse<RapydDocumentType[]>,
    next: NextFunction
  ) => {
    try {
      const { id: userId } = req.session.user

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

  public createWallet = async (
    req: Request,
    res: CustomResponse<RapydWallet>,
    next: NextFunction
  ) => {
    const { id, email } = req.session.user

    try {
      const {
        body: { firstName, lastName, address, city, country, zip, phone }
      } = await validate(walletSchema, req)

      const createWalletResponse = await this.deps.rapydService.createWallet({
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

      req.session.user = {
        ...req.session.user,
        needsWallet: false,
        needsIDProof: false
      }

      await req.session.save()

      res.status(200).json({
        success: true,
        message: 'Wallet created succesfully',
        data: createWalletResponse
      })
    } catch (e) {
      next(e)
    }
  }

  public verifyIdentity = async (
    req: Request,
    res: CustomResponse<RapydIdentityResponse>,
    next: NextFunction
  ) => {
    const { id: userId } = req.session.user

    try {
      const {
        body: {
          documentType,
          frontSideImage,
          frontSideImageType,
          faceImage,
          faceImageType,
          backSideImage,
          backSideImageType
        }
      } = await validate(kycSchema, req)

      const verifyIdentityResponse =
        await this.deps.rapydService.verifyIdentity({
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

  public updateProfile = async (
    req: Request,
    res: CustomResponse<RapydWallet>,
    next: NextFunction
  ) => {
    const { id: userId } = req.session.user

    try {
      const {
        body: { firstName, lastName }
      } = await validate(profileSchema, req)

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
    } catch (e) {
      next(e)
    }
  }
}
