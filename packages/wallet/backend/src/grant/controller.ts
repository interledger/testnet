import { NextFunction, Request } from 'express'
import { RafikiAuthService } from '@/rafikiAuth/service'
import { Grant } from '@/rafikiAuth/generated/graphql'

interface IGrantController {
  list: ControllerFunction<Grant[]>
  revoke: ControllerFunction<void>
}
interface GrantControllerDependencies {
  rafikiAuthService: RafikiAuthService
}

export class GrantController implements IGrantController {
  constructor(private deps: GrantControllerDependencies) {}

  list = async (
    _req: Request,
    res: CustomResponse<Grant[]>,
    next: NextFunction
  ) => {
    try {
      const grants = await this.deps.rafikiAuthService.listGrants()
      res.json({ success: true, message: 'Success', data: grants })
    } catch (e) {
      next(e)
    }
  }

  revoke = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      await this.deps.rafikiAuthService.revokeGrant(req.params.id)

      res.json({ success: true, message: 'Success' })
    } catch (e) {
      next(e)
    }
  }
}
