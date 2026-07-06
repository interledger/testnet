import { Request, Response, NextFunction } from 'express'
import { TerminalService } from './service'

export class TerminalController {
  constructor(private terminalService: TerminalService) {}

  getOnboardingFormDefinition = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const formDefinition =
        await this.terminalService.getOnboardingFormDefinition()
      res.status(200).json(toSuccessResponse(formDefinition))
    } catch (error) {
      next(error)
    }
  }
}
