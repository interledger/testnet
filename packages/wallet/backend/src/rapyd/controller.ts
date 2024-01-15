import { NextFunction, Request } from 'express'
import { AccountService } from '@/account/service'
import { WalletAddressService } from '@/walletAddress/service'
import { validate } from '@/shared/validate'
import { getRandomValues } from 'crypto'
import { Options, RapydService } from './service'
import { kycSchema, profileSchema, walletSchema } from './validation'
import { User } from '@/user/model'
import {
  RapydDocumentType,
  RapydIdentityResponse,
  RapydWallet
} from './response-validation'

interface IRapydController {
  getCountryNames: ControllerFunction<Options[]>
  getDocumentTypes: ControllerFunction<RapydDocumentType[]>
  createWallet: ControllerFunction<RapydWallet>
  verifyIdentity: ControllerFunction<RapydIdentityResponse>
  updateProfile: ControllerFunction
}

export class RapydController implements IRapydController {
  constructor(
    private accountService: AccountService,
    private walletAddressService: WalletAddressService,
    private rapydService: RapydService
  ) {}

  public getCountryNames = async (
    _: Request,
    res: CustomResponse<Options[]>,
    next: NextFunction
  ) => {
    try {
      const countryNamesResult = await this.rapydService.getCountryNames()

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
      const documentTypesResult =
        await this.rapydService.getDocumentTypes(userId)
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

      const createWalletResponse = await this.rapydService.createWallet({
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

      req.session.user.needsWallet = false
      await req.session.save()

      const defaultAccount = await this.accountService.createDefaultAccount(id)
      if (defaultAccount) {
        const typedArray = new Uint32Array(1)
        getRandomValues(typedArray)
        const walletAddressName = typedArray[0].toString(16)

        await this.walletAddressService.create({
          accountId: defaultAccount.id,
          walletAddressName,
          publicName: 'Default Payment Pointer',
          userId: id,
          isWM: false
        })
      }

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

      const verifyIdentityResponse = await this.rapydService.verifyIdentity({
        userId,
        documentType,
        frontSideImage,
        frontSideImageType,
        faceImage,
        faceImageType,
        backSideImage,
        backSideImageType
      })

      await User.query()
        .findById(userId)
        .patch({ kycId: verifyIdentityResponse.id })

      req.session.user.needsIDProof = false
      await req.session.save()

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
    res: CustomResponse,
    next: NextFunction
  ) => {
    const { id: userId } = req.session.user

    try {
      const {
        body: { firstName, lastName }
      } = await validate(profileSchema, req)

      await this.rapydService.updateProfile(userId, firstName, lastName)

      res.status(200).json({
        success: true,
        message: 'Profile updated succesfully'
      })
    } catch (e) {
      next(e)
    }
  }
}
