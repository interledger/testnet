/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from 'winston'
import { User } from '../user/model'
import { RapydClient } from './rapyd-client'
import { NotFound } from '../errors'
import crypto from 'crypto'

interface RapydServiceDependencies {
  rapyd: RapydClient
  logger: Logger
}

export class RapydService {
  constructor(private deps: RapydServiceDependencies) {}

  public async getDocumentTypes(userId: string) {
    const user = await User.query().findById(userId)

    if (!user) throw new Error(`user doesn't exist`)

    const country = user.country
    if (!country) throw new Error('User has no country')

    const documentTypesResponse = await this.deps.rapyd.getDocumentTypes(
      country
    )

    if ((documentTypesResponse as any).status.status !== 'SUCCESS') {
      //! Throw
      throw new Error(
        `Unable to get document types from rapyd : ${documentTypesResponse.status.message}`
      )
    }

    return documentTypesResponse.data.map((item: RapydDocumentType) => ({
      type: item.type,
      name: item.name,
      isBackRequired: item.is_back_required
    }))
  }

  public async getCountryNames() {
    const countriesResponse = await this.deps.rapyd.getCountryNames()

    if ((countriesResponse as any).status.status !== 'SUCCESS') {
      //! Thorw
      throw new Error()
    }
    const countryNames = countriesResponse.data.map((i: RapydCountry) => ({
      label: i.name,
      value: i.iso_alpha2
    }))

    return countryNames
  }

  public async createWallet(
    firstName: string,
    lastName: string,
    address: string,
    city: string,
    country: string,
    zip: string,
    email: string,
    id: string,
    phone?: string
  ) {
    const randomIdentifier = crypto
      .randomBytes(8)
      .toString('base64')
      .slice(0, 8)
    const rapydReferenceId = `${firstName}-${lastName}-${randomIdentifier}`

    const result = await this.deps.rapyd.createWallet({
      first_name: firstName,
      last_name: lastName,
      email,
      ewallet_reference_id: rapydReferenceId,
      phone_number: phone,
      type: 'person',
      contact: {
        phone_number: phone,
        email,
        first_name: firstName,
        last_name: lastName,
        contact_type: 'personal',
        address: {
          name: `${firstName} ${lastName}`,
          line_1: address,
          city,
          country,
          zip,
          phone_number: phone
        }
      }
    })

    if (result.status.status !== 'SUCCESS') {
      //!THROW
      // this.deps.logger
      // throw new InternalServerError()
    }

    const eWallet = result.data
    const user = await User.query().patchAndFetchById(id, {
      firstName: firstName,
      lastName: lastName,
      address: `${address}, ${city}, ${zip}`,
      country,
      rapydReferenceId: rapydReferenceId,
      rapydWalletId: eWallet?.id,
      rapydContactId: eWallet?.contacts?.data[0]?.id
    })

    if (!user) throw new NotFound()

    //! Need to update the kyc info of the user.
    /*
 const { accessToken: newAccessToken, expiresIn: accessTokenExpiresIn } =
      generateJWT(user)
    appendAccessTokenToCookie(res, newAccessToken, accessTokenExpiresIn)

    */

    return eWallet
  }

  public async verifyIdentity(
    userId: string,
    documentType: string,
    frontSideImage: string,
    frontSideImageType: string,
    faceImage: string,
    faceImageType: string,
    backSideImage?: string,
    backSideImageType?: string
  ) {
    try {
      const user = await User.query().findById(userId)
      if (!user) throw new Error(`user doesn't exist`)

      const country = user.country
      if (!country) throw new Error(`country code doesn't exist in database`)

      const values = {
        reference_id: user.rapydReferenceId,
        ewallet: user.rapydWalletId,
        country,
        document_type: documentType,
        front_side_image: frontSideImage,
        front_side_image_mime_type: frontSideImageType,
        face_image: faceImage,
        face_image_mime_type: faceImageType,
        back_side_image: backSideImage,
        back_side_image_mime_type: backSideImageType
      }
      const result = await this.deps.rapyd.verifyIdentity(values)

      if (result.status.status !== 'SUCCESS')
        //! Throw
        throw new Error()
      // return res.status(500).json({
      //   message: `Unable to send kyc documents : ${result.status.message}`,
      //   success: false
      // })

      return result.data
    } catch (error) {
      //! Throw
      throw new Error()
    }
  }

  public async updateProfile(
    userId: string,
    firstName: string,
    lastName: string
  ) {
    try {
      let user = await User.query().findById(userId)
      if (!user) throw new Error(`user doesn't exist`)

      const result = await this.deps.rapyd.updateProfile({
        first_name: firstName,
        last_name: lastName,
        ewallet: user.rapydWalletId
      })

      if (result.status.status !== 'SUCCESS')
        //! Throw
        throw new Error()
      // return res.status(500).json({
      //   message: `Unable to update profile : ${result.status.message}`,
      //   success: false
      // })

      user = await User.query().patchAndFetchById(userId, {
        firstName: firstName,
        lastName: lastName,
        rapydReferenceId: user.rapydReferenceId
      })

      if (!user) throw new NotFound()

      return result.data
    } catch (error) {
      //!Throw
      throw new Error()
      //   log.error(error)
      //   return res
      //     .status(500)
      //     .json({ message: 'Unable to update profile', success: false })
    }
  }
}
