import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import { Request, Response } from 'express'
import { TerminalController } from '@/terminal/controller'
import { TerminalService } from '@/terminal/service'
import { FieldDefinitions } from '@/terminal/model'

describe('Terminal Controller', () => {
  const mockTerminalService = {
    getOnboardingFormDefinition: jest.fn()
  }

  let terminalController: TerminalController
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  const next = jest.fn()

  beforeEach(() => {
    terminalController = new TerminalController(
      mockTerminalService as unknown as TerminalService
    )
    req = createRequest()
    res = createResponse()
  })

  it('should return onboarding form definition', async () => {
    const formDefinition = [
      {
        key: 'mockContactEmail',
        label: 'Mock contact email',
        description: 'We use this to send onboarding confirmation.',
        type: 'email',
        required: true,
        placeholder: 'me@interledger.org',
        order: 2,
        format: 'email',
        maxLength: 255
      },
      {
        id: '1acf7723-e1cd-44e7-a5db-3f614ce045ac',
        key: 'mockMerchantCategoryCode',
        label: 'Mock merchant category',
        type: 'select',
        required: true,
        order: 1
      }
    ] as unknown as FieldDefinitions[]

    mockTerminalService.getOnboardingFormDefinition.mockResolvedValue(
      formDefinition
    )

    await terminalController.getOnboardingFormDefinition(req, res, next)

    expect(mockTerminalService.getOnboardingFormDefinition).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
    expect(res._getJSONData()).toMatchObject({
      success: true,
      result: formDefinition
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next on service failure', async () => {
    mockTerminalService.getOnboardingFormDefinition.mockRejectedValueOnce(
      new Error('Unexpected error')
    )

    await terminalController.getOnboardingFormDefinition(req, res, next)

    expect(next).toHaveBeenCalled()
  })
})
