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
import { WalletAddressService } from '@/walletAddress/service'

describe('Terminal Controller', () => {
  const mockTerminalService = {
    getOnboardingFormDefinition: jest.fn()
  }
  const mockWalletAddressService = {
    getByUrl: jest.fn()
  }

  let terminalController: TerminalController
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  const next = jest.fn()

  beforeEach(() => {
    terminalController = new TerminalController(
      mockTerminalService as unknown as TerminalService,
      mockWalletAddressService as unknown as WalletAddressService
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

  describe('validation', () => {
    it('should return true when the email format is valid', async () => {
      const formDefinition = [
        {
          key: 'mockContactEmail',
          label: 'Mock contact email',
          description: 'We use this to send onboarding confirmation.',
          type: 'email',
          required: true,
          placeholder: 'me@interledger.org',
          order: 2,
          validation: {
            maxLength: 255,
            format: 'email'
          }
        }
      ] as unknown as FieldDefinitions[]

      mockTerminalService.getOnboardingFormDefinition.mockResolvedValue(
        formDefinition
      )

      req.body = {
        mockContactEmail: 'test@example.com'
      }

      await terminalController.validation(req, res, next)

      expect(mockTerminalService.getOnboardingFormDefinition).toHaveBeenCalled()
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        valid: true,
        response: {
          mockContactEmail: 'test@example.com'
        }
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should call next with a validation error when a required field is missing', async () => {
      const formDefinition = [
        {
          key: 'mockContactEmail',
          label: 'Mock contact email',
          type: 'email',
          required: true,
          order: 1
        }
      ] as unknown as FieldDefinitions[]

      mockTerminalService.getOnboardingFormDefinition.mockResolvedValue(
        formDefinition
      )

      req.body = {}

      await terminalController.validation(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid input',
          errors: { mockContactEmail: 'mockContactEmail is required' }
        })
      )
    })

    it('should accept a numeric value of exactly 0 when min is 0', async () => {
      const formDefinition = [
        {
          key: 'mockMinNumber',
          label: 'Mock Min Number',
          type: 'number',
          required: true,
          order: 1,
          validation: { min: 0 }
        }
      ] as unknown as FieldDefinitions[]

      mockTerminalService.getOnboardingFormDefinition.mockResolvedValue(
        formDefinition
      )

      req.body = { mockMinNumber: 0 }

      await terminalController.validation(req, res, next)

      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        valid: true,
        response: {
          mockMinNumber: 0
        }
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should reject a select value that is not one of the field options', async () => {
      const formDefinition = [
        {
          key: 'mockMerchantCategoryCode',
          label: 'Mock merchant category code',
          type: 'select',
          required: true,
          order: 1,
          options: [
            { value: '5411', label: 'Grocery stores' },
            { value: '5412', label: 'Eating places / restaurants' }
          ]
        }
      ] as unknown as FieldDefinitions[]

      mockTerminalService.getOnboardingFormDefinition.mockResolvedValue(
        formDefinition
      )

      req.body = { mockMerchantCategoryCode: '5432' }

      await terminalController.validation(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid input',
          errors: {
            mockMerchantCategoryCode:
              'Invalid value for mockMerchantCategoryCode'
          }
        })
      )
    })

    it('should approve a select value that is one of the field options', async () => {
      const formDefinition = [
        {
          key: 'mockMerchantCategoryCode',
          label: 'Mock merchant category code',
          type: 'select',
          required: true,
          order: 1,
          options: [
            { value: '5411', label: 'Grocery stores' },
            { value: '5412', label: 'Eating places / restaurants' }
          ]
        }
      ] as unknown as FieldDefinitions[]

      mockTerminalService.getOnboardingFormDefinition.mockResolvedValue(
        formDefinition
      )

      req.body = { mockMerchantCategoryCode: '5412' }

      await terminalController.validation(req, res, next)

      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        valid: true,
        response: {
          mockMerchantCategoryCode: '5412'
        }
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should reject a checkbox value that does not match mustEqual', async () => {
      const formDefinition = [
        {
          key: 'mockAcceptTerms',
          label: 'Mock accept Terms',
          type: 'checkbox',
          required: true,
          order: 1,
          validation: { mustEqual: true }
        }
      ] as unknown as FieldDefinitions[]

      mockTerminalService.getOnboardingFormDefinition.mockResolvedValue(
        formDefinition
      )

      req.body = { mockAcceptTerms: false }

      await terminalController.validation(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid input',
          errors: {
            mockAcceptTerms: 'mockAcceptTerms must be true'
          }
        })
      )
    })

    it('should return 200 when the wallet address format is valid', async () => {
      const formDefinition = [
        {
          key: 'mockWalletAddress',
          label: 'Mock wallet address',
          type: 'text',
          required: true,
          order: 1,
          validation: { format: 'payment-pointer' }
        }
      ] as unknown as FieldDefinitions[]

      mockTerminalService.getOnboardingFormDefinition.mockResolvedValue(
        formDefinition
      )
      mockWalletAddressService.getByUrl.mockResolvedValue({
        id: 'mocked-wallet-address'
      })

      req.body = {
        mockWalletAddress: 'https://rafiki-backend.testnet.test/mockAddress'
      }

      await terminalController.validation(req, res, next)

      expect(mockWalletAddressService.getByUrl).toHaveBeenCalledWith(
        'https://rafiki-backend.testnet.test/mockAddress'
      )
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        valid: true,
        response: {
          mockWalletAddress: 'https://rafiki-backend.testnet.test/mockAddress'
        }
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should fail when the phone number type is invalid', async () => {
      const formDefinition = [
        {
          key: 'mockPhoneNumber',
          label: 'Mock Phone Number',
          type: 'tel',
          required: true,
          order: 1,
          validation: { minLength: 10 }
        }
      ] as unknown as FieldDefinitions[]

      mockTerminalService.getOnboardingFormDefinition.mockResolvedValue(
        formDefinition
      )

      req.body = { mockPhoneNumber: '+4123invalidPhoneNumber' }

      await terminalController.validation(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid input',
          errors: {
            mockPhoneNumber: 'Invalid phone number'
          }
        })
      )
    })

    it('should return true when the country code format is valid', async () => {
      const formDefinition = [
        {
          key: 'mockCountryCode',
          label: 'Mock Country Code',
          type: 'text',
          required: true,
          order: 1,
          validation: {
            format: 'iso-country'
          }
        }
      ] as unknown as FieldDefinitions[]

      mockTerminalService.getOnboardingFormDefinition.mockResolvedValue(
        formDefinition
      )

      req.body = { mockCountryCode: 'USA' }

      await terminalController.validation(req, res, next)

      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        valid: true,
        response: {
          mockCountryCode: 'USA'
        }
      })
      expect(next).not.toHaveBeenCalled()
    })
  })
})
