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

  beforeEach(() => {
    const mockQueryBuilder = {
      withGraphFetched: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue(mockFieldDefinitions)
    } as unknown as ReturnType<typeof FieldDefinitions.query>

    jest.spyOn(FieldDefinitions, 'query').mockReturnValue(mockQueryBuilder)
  })

  it('should return the onboarding form definition', async () => {
    const terminalService = new TerminalService(mockLogger)
    const formDefinition = await terminalService.getOnboardingFormDefinition()

    expect(formDefinition).toEqual([
      {
        key: 'mockContactEmail',
        label: 'Mock contact email',
        type: 'email',
        required: true,
        order: 2,
        description: 'We use this to send onboarding confirmation.',
        placeholder: 'me@interledger.com',
        validation: { format: 'email', maxLength: 255 }
      },
      {
        key: 'mockMerchantCategoryCode',
        label: 'Mock merchant category',
        type: 'select',
        required: true,
        order: 1,
        options: [{ value: '5311', label: 'Department stores' }]
      }
    ])
  })
})
