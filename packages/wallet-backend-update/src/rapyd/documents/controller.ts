/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request } from 'express'
import { Logger } from 'winston'
import { User } from '../../user/model'
import { DocumentsService } from './service'

interface IRapydDocumentsController {
  getDocumentTypes: (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => Promise<void>
}
interface RapydDocumentsDependencies {
  logger: Logger
  documentsService: DocumentsService
}

export class RapydDocumentsController implements IRapydDocumentsController {
  constructor(private deps: RapydDocumentsDependencies) {}

  public async getDocumentTypes(
    req: Request,
    res: CustomResponse<any>,
    next: NextFunction
  ) {
    try {
      const { id: userId } = (req as any).user as User

      const documentTypesResult =
        await this.deps.documentsService.getDocumentTypes(userId)
      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: documentTypesResult })
    } catch (e) {
      next(e)
    }
  }
}
