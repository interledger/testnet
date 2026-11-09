import { Logger } from 'winston'
import { FieldDefinitions } from '@/terminal/model'
import { TerminalService } from '@/terminal/service'

describe('Terminal Service', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  } as unknown as Logger

  const mockFieldDefinitions = [
    {
      id: '1',
      key: 'mockContactEmail',
      label: 'Mock contact email',
      description: 'We use this to send onboarding confirmation.',
      type: 'email' as const,
      required: true,
      placeholder: 'me@interledger.com',
      order: 2,
      format: 'email',
      maxLength: 255
    },
    {
      id: '2',
      key: 'mockMerchantCategoryCode',
      label: 'Mock merchant category',
      type: 'select' as const,
      required: true,
      order: 1,
      options: [
        {
          id: 'opt-1',
          value: '5311',
          label: 'Department stores'
        }
      ]
    }
  ]

  const expectedFormDefinition = [
    {
      key: 'mockContactEmail',
      label: 'Mock contact email',
      description: 'We use this to send onboarding confirmation.',
      type: 'email',
      required: true,
      placeholder: 'me@interledger.com',
      order: 2,
      validation: {
        format: 'email',
        maxLength: 255
      }
    },
    {
      key: 'mockMerchantCategoryCode',
      label: 'Mock merchant category',
      type: 'select',
      required: true,
      order: 1,
      options: [
        {
          value: '5311',
          label: 'Department stores'
        }
      ]
    }
  ]

  const mockFullFieldDefinitions = [
    {
      id: '1',
      key: 'mockContactEmail',
      label: 'Mock contact email',
      description: 'We use this to send onboarding confirmation.',
      type: 'email' as const,
      required: true,
      placeholder: 'me@interledger.org',
      order: 2,
      format: 'email',
      maxLength: 255
    },
    {
      id: '2',
      key: 'mockMerchantCategoryCode',
      label: 'Mock merchant category',
      type: 'select' as const,
      required: true,
      order: 1,
      options: [
        {
          id: 'opt-1',
          value: '5311',
          label: 'Department stores'
        }
      ]
    },
    {
      id: '3',
      key: 'mockBusinessName',
      label: 'Mock business name',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter your business name',
      order: 3,
      minLength: 3,
      maxLength: 40
    },
    {
      id: '4',
      key: 'mockTelephoneNumber',
      label: 'Mock telephone number',
      type: 'tel' as const,
      required: true,
      placeholder: '1234567890',
      order: 4,
      minLength: 9,
      pattern: '^[0-9]+$'
    },
    {
      id: '5',
      key: 'mockDeviceId',
      label: 'Mock device ID',
      type: 'number' as const,
      required: true,
      placeholder: 'Enter your device ID',
      order: 6,
      min: 2,
      max: 15
    },
    {
      id: '6',
      key: 'mockAcceptTerms',
      label: 'Mock accept terms',
      type: 'checkbox' as const,
      required: true,
      order: 7,
      mustEqual: true
    },
    {
      id: '7',
      key: 'mockFiscalYear',
      label: 'Mock fiscal year',
      type: 'date' as const,
      placeholder: 'YYYY-MM-DD',
      order: 5
    }
  ]

  const expectedAllFormDefinitions = [
    {
      key: 'mockContactEmail',
      label: 'Mock contact email',
      description: 'We use this to send onboarding confirmation.',
      type: 'email',
      required: true,
      placeholder: 'me@interledger.org',
      order: 2,
      validation: {
        format: 'email',
        maxLength: 255
      }
    },
    {
      key: 'mockMerchantCategoryCode',
      label: 'Mock merchant category',
      type: 'select',
      required: true,
      order: 1,
      options: [
        {
          value: '5311',
          label: 'Department stores'
        }
      ]
    },
    {
      key: 'mockBusinessName',
      label: 'Mock business name',
      type: 'text',
      required: true,
      placeholder: 'Enter your business name',
      order: 3,
      validation: {
        minLength: 3,
        maxLength: 40
      }
    },
    {
      key: 'mockTelephoneNumber',
      label: 'Mock telephone number',
      type: 'tel',
      required: true,
      placeholder: '1234567890',
      order: 4,
      validation: {
        minLength: 9,
        pattern: '^[0-9]+$'
      }
    },
    {
      key: 'mockDeviceId',
      label: 'Mock device ID',
      type: 'number',
      required: true,
      placeholder: 'Enter your device ID',
      order: 6,
      validation: {
        min: 2,
        max: 15
      }
    },
    {
      key: 'mockAcceptTerms',
      label: 'Mock accept terms',
      type: 'checkbox',
      required: true,
      order: 7,
      validation: {
        mustEqual: true
      }
    },
    {
      key: 'mockFiscalYear',
      label: 'Mock fiscal year',
      type: 'date',
      placeholder: 'YYYY-MM-DD',
      order: 5
    }
  ]

  it('should return the onboarding form definition', async () => {
    const mockQueryBuilder = {
      withGraphFetched: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue(mockFieldDefinitions)
    } as unknown as ReturnType<typeof FieldDefinitions.query>

    jest.spyOn(FieldDefinitions, 'query').mockReturnValue(mockQueryBuilder)

    const terminalService = new TerminalService(mockLogger)
    const formDefinition = await terminalService.getOnboardingFormDefinition()

    expect(formDefinition).toEqual(expectedFormDefinition)
  })

  it('should return all onboarding form definitions', async () => {
    const mockQueryBuilder = {
      withGraphFetched: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue(mockFullFieldDefinitions)
    } as unknown as ReturnType<typeof FieldDefinitions.query>

    jest.spyOn(FieldDefinitions, 'query').mockReturnValue(mockQueryBuilder)

    const terminalService = new TerminalService(mockLogger)
    const formDefinitions =
      await terminalService.getAllOnboardingFormDefinitions()

    expect(formDefinitions).toEqual(expectedAllFormDefinitions)
  })
})
