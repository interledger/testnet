import { Request, Response, NextFunction } from 'express'
import { TerminalService } from './service'
import { toSuccessResponse } from '@shared/backend'
import { requestSchema } from './validation'
import { WalletAddressService } from '@/walletAddress/service'
import { validate } from '@/shared/validate'

export class TerminalController {
  constructor(
    private terminalService: TerminalService,
    private walletAddressService: WalletAddressService
  ) {}

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

  validation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const formDefinition =
        await this.terminalService.getOnboardingFormDefinition()
      const schema = await requestSchema(formDefinition)
      const { body } = await validate(schema, req)

      // check if walletAddress exists
      const paymentPointerField = formDefinition.find(
        (value) => value.validation?.format === 'payment-pointer'
      )

      if (paymentPointerField) {
        const checkWalletAddress = await this.walletAddressService.getByUrl(
          req.body[paymentPointerField.key]
        )
        if (!checkWalletAddress) {
          return res.status(400).json({
            valid: false,
            error: {
              field: paymentPointerField.key,
              message: 'Wallet Address not found!'
            }
          })
        }
      }

      res.status(200).json({ valid: true, response: body })
    } catch (error) {
      next(error)
    }
  }
}
