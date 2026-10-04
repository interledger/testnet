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
    getOnboardingFormDefinition: jest.fn(),
    getAllOnboardingFormDefinitions: jest.fn()
  }

  let terminalController: TerminalController
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  const next = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    terminalController = new TerminalController(
      mockTerminalService as unknown as TerminalService
    )
    req = createRequest()
    res = createResponse()
  })

  it('should return the minimal onboarding fields by default', async () => {
    const formDefinition = [
      {
        key: 'contactEmail',
        label: 'Contact email',
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
        key: 'merchantCategoryCode',
        label: 'Merchant category',
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
    expect(
      mockTerminalService.getAllOnboardingFormDefinitions
    ).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
    const responseBody = res._getJSONData()
    expect(responseBody).toMatchObject({ success: true })
    expect(responseBody.result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'contactEmail' }),
        expect.objectContaining({ key: 'merchantCategoryCode' })
      ])
    )
    expect(responseBody.result).toHaveLength(2)
    expect(next).not.toHaveBeenCalled()
  })

  it('should return the full onboarding form', async () => {
    const fullFormDefinition = [
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
      },
      {
        key: 'mockBusinessName',
        label: 'Mock business name',
        type: 'text',
        required: true,
        placeholder: 'Enter your business name',
        order: 3,
        minLength: 3,
        maxLength: 40
      },
      {
        key: 'mockTelephoneNumber',
        label: 'Mock telephone number',
        type: 'tel',
        required: true,
        placeholder: '1234567890',
        order: 4,
        minLength: 9,
        pattern: '^[0-9]+$'
      },
      {
        key: 'deviceId',
        label: 'Device ID',
        type: 'number',
        required: true,
        placeholder: 'Enter your device ID',
        order: 6,
        min: 2,
        max: 15
      },
      {
        key: 'acceptTerms',
        label: 'Accept Terms and Conditions',
        type: 'checkbox',
        required: true,
        order: 7,
        mustEqual: true
      },
      {
        key: 'fiscalYear',
        label: 'Fiscal Year',
        type: 'date',
        placeholder: 'YYYY-MM-DD',
        order: 5
      }
    ] as unknown as FieldDefinitions[]

    mockTerminalService.getAllOnboardingFormDefinitions.mockResolvedValue(
      fullFormDefinition
    )

    await terminalController.getAllOnboardingFormDefinition(req, res, next)

    expect(
      mockTerminalService.getAllOnboardingFormDefinitions
    ).toHaveBeenCalled()
    expect(res.statusCode).toBe(200)
    expect(res._getJSONData()).toMatchObject({
      success: true,
      result: fullFormDefinition
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
