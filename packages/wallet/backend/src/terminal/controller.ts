import { Request, Response, NextFunction } from 'express'
import { TerminalService } from './service'
import { toSuccessResponse } from '@shared/backend'

export class TerminalController {
  constructor(private terminalService: TerminalService) {}

  getOnboardingFormDefinition = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const full = String(req.query?.full) === 'true'

      if (full) {
        const formDefinition =
          await this.terminalService.getAllOnboardingFormDefinitions()

        return res.status(200).json(toSuccessResponse(formDefinition))
      }

      const minimalKeys = ['merchantCategoryCode', 'contactEmail']
      const formDefinition =
        await this.terminalService.getOnboardingFormDefinition()
      const filtered = formDefinition.filter((f) => minimalKeys.includes(f.key))

      return res.status(200).json(toSuccessResponse(filtered))
    } catch (error) {
      next(error)
    }
  }

  getAllOnboardingFormDefinition = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const formDefinition =
        await this.terminalService.getAllOnboardingFormDefinitions()
      res.status(200).json(toSuccessResponse(formDefinition))
    } catch (error) {
      next(error)
    }
  }
}
