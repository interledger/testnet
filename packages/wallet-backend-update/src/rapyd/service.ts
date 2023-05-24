import { NotFound } from '@/errors'
import { User } from '@/user/model'
import crypto from 'crypto'
import { Logger } from 'winston'
import { RapydClient } from './rapyd-client'

interface RapydServiceDependencies {
  rapyd: RapydClient
  logger: Logger
}

type VerifyIdentityParams = {
  userId: string
  documentType: string
  frontSideImage: string
  frontSideImageType: string
  faceImage: string
  faceImageType: string
  backSideImage?: string
  backSideImageType?: string
}

type CreateWalletParams = {
  firstName: string
  lastName: string
  address: string
  city: string
  country: string
  zip: string
  email: string
  id: string
  phone?: string
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

    if (documentTypesResponse.data.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to get document types from rapyd : ${documentTypesResponse.data.status.message}`
      )
    }

    return documentTypesResponse.data.data.map((item: RapydDocumentType) => ({
      type: item.type,
      name: item.name,
      isBackRequired: item.is_back_required
    }))
  }

  public async getCountryNames() {
    const countriesResponse = await this.deps.rapyd.getCountryNames()

    if (countriesResponse.data.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to retrieve country names from rapyd, ${countriesResponse.data.status.message}`
      )
    }
    return countriesResponse.data.data.map((i: RapydCountry) => ({
      label: i.name,
      value: i.iso_alpha2
    }))
  }

  public async createWallet(params: CreateWalletParams) {
    const randomIdentifier = crypto
      .randomBytes(8)
      .toString('base64')
      .slice(0, 8)
    const rapydReferenceId = `${params.firstName}-${params.lastName}-${randomIdentifier}`

    const result = await this.deps.rapyd.createWallet({
      first_name: params.firstName,
      last_name: params.lastName,
      email: params.email,
      ewallet_reference_id: rapydReferenceId,
      phone_number: params.phone,
      type: 'person',
      contact: {
        phone_number: params.phone,
        email: params.email,
        first_name: params.firstName,
        last_name: params.lastName,
        contact_type: 'personal',
        address: {
          name: `${params.firstName} ${params.lastName}`,
          line_1: params.address,
          city: params.city,
          country: params.country,
          zip: params.zip,
          phone_number: params.phone
        }
      }
    })

    if (result.data.status.status !== 'SUCCESS') {
      throw new Error(
        `Unable to create wallet, ${result?.data?.status?.message}`
      )
    }

    const eWallet = result.data.data
    const user = await User.query().patchAndFetchById(params.id, {
      firstName: params.firstName,
      lastName: params.lastName,
      address: `${params.address}, ${params.city}, ${params.zip}`,
      country: params.country,
      rapydReferenceId: rapydReferenceId,
      rapydWalletId: eWallet?.id,
      rapydContactId: eWallet?.contacts?.data?.[0]?.id
    })

    if (!user) throw new NotFound('User does not exist')

    //! Need to update the kyc info of the user.
    /*
 const { accessToken: newAccessToken, expiresIn: accessTokenExpiresIn } =
      generateJWT(user)
    appendAccessTokenToCookie(res, newAccessToken, accessTokenExpiresIn)

    */

    return eWallet
  }

  public async verifyIdentity(
    params: VerifyIdentityParams
  ): Promise<RapydIdentityResponse> {
    const user = await User.query().findById(params.userId)
    if (!user) throw new NotFound(`user doesn't exist`)

    const country = user.country
    if (!country) throw new NotFound(`country code doesn't exist in database`)

    const values = {
      reference_id: user.rapydReferenceId,
      ewallet: user.rapydWalletId,
      country,
      document_type: params.documentType,
      front_side_image: params.frontSideImage,
      front_side_image_mime_type: params.frontSideImageType,
      face_image: params.faceImage,
      face_image_mime_type: params.faceImageType,
      back_side_image: params.backSideImage,
      back_side_image_mime_type: params.backSideImageType
    }
    const result = await this.deps.rapyd.verifyIdentity(values)

    if (result.data.status.status !== 'SUCCESS')
      throw new Error(
        `Unable to send kyc documents : ${result.data.status.message}`
      )

    return result.data.data
  }

  public async updateProfile(
    userId: string,
    firstName: string,
    lastName: string
  ): Promise<RapydWallet> {
    let user = await User.query().findById(userId)
    if (!user) throw new NotFound(`user doesn't exist`)

    const result = await this.deps.rapyd.updateProfile({
      first_name: firstName,
      last_name: lastName,
      ewallet: user.rapydWalletId
    })

    if (result.data.status.status !== 'SUCCESS')
      throw new Error(
        `Unable to update profile : ${result.data.status.message}`
      )

    user = await User.query().patchAndFetchById(userId, {
      firstName: firstName,
      lastName: lastName,
      rapydReferenceId: user.rapydReferenceId
    })

    return result.data.data
  }
}
