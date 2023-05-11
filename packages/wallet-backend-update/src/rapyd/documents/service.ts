/* eslint-disable @typescript-eslint/no-explicit-any */
import { Logger } from 'winston'
import { RapydClient } from '../rapyd-client'
import { User } from '../../user/model'

interface DocumentsServiceDependencies {
  rapyd: RapydClient
  logger: Logger
}

export class DocumentsService {
  constructor(private deps: DocumentsServiceDependencies) {}

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
}
