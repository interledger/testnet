import { faker } from '@faker-js/faker'
import { logInSchema, signUpSchema } from '@/auth/validation'
import z from 'zod'
import { PartialModelObject } from 'objection'
import { Transaction } from '../src/transaction/model'
import { kycSchema, walletSchema } from '@/rapyd/validation'
import { uuid } from '@/tests/utils'

export type LogInRequest = z.infer<typeof logInSchema>

export const fakeLoginData = () => {
  return {
    email: faker.internet.email(),
    password: faker.internet.password()
  }
}
export const mockLogInRequest = (
  overrides?: Partial<LogInRequest['body']>
): LogInRequest => ({
  body: {
    ...fakeLoginData(),
    ...overrides
  }
})

type SignUpRequest = z.infer<typeof signUpSchema>
export const mockSignUpRequest = (
  overrides?: Partial<SignUpRequest['body']>
): SignUpRequest => {
  const result = mockLogInRequest()
  return {
    body: {
      ...result.body,
      confirmPassword: result.body.password,
      ...overrides
    }
  }
}

type CreateWalletRequest = z.infer<typeof walletSchema>
export const mockCreateWalletRequest = (
  overrides?: Partial<CreateWalletRequest['body']>
): CreateWalletRequest => {
  return {
    body: {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      address: faker.location.secondaryAddress(),
      city: faker.location.city(),
      country: faker.location.country(),
      zip: faker.location.zipCode(),
      ...overrides
    }
  }
}

type VerifyIdentityRequest = z.infer<typeof kycSchema>
export const mockVerifyIdentityRequest = (): VerifyIdentityRequest => {
  return {
    body: {
      documentType: faker.lorem.slug(),
      frontSideImage: faker.image.url(),
      frontSideImageType: faker.lorem.slug(),
      faceImage: faker.image.url(),
      faceImageType: faker.lorem.slug()
    }
  }
}

export const mockRapyd = {
  rapyd: {
    issueVirtualAccount: () => ({
      status: {
        status: 'SUCCESS'
      },
      data: {
        id: 'mocked'
      }
    }),
    simulateBankTransferToWallet: () => ({
      status: {
        status: 'SUCCESS'
      },
      data: {
        transactions: [
          {
            id: 'mocked'
          }
        ]
      }
    }),
    withdrawFundsFromAccount: () => ({
      status: {
        status: 'SUCCESS'
      },
      data: {
        id: 'mocked'
      }
    }),
    getAccountsBalance: () => ({
      data: [
        {
          currency: mockedListAssets[0].code,
          balance: 777
        }
      ] as Partial<RapydAccountBalance>
    }),
    getDocumentTypes: () => ({
      status: {
        status: 'SUCCESS'
      },
      data: [
        {
          country: faker.location.country(),
          type: faker.lorem.slug(),
          name: faker.lorem.word(5),
          is_back_required: true
        }
      ]
    }),
    getCountryNames: () => ({
      status: {
        status: 'SUCCESS'
      },
      data: [
        {
          id: faker.lorem.slug(),
          name: faker.lorem.word(5),
          iso_alpha2: faker.location.countryCode('alpha-2'),
          iso_alpha3: faker.location.countryCode('alpha-3')
        }
      ]
    }),
    createWallet: () => ({
      status: {
        status: 'SUCCESS'
      },
      data: {
        id: 'mocked',
        type: 'person'
      }
    }),

    verifyIdentity: () => ({
      status: {
        status: 'SUCCESS'
      },
      data: {
        id: uuid(),
        reference_id: uuid()
      }
    }),

    updateProfile: (profile: RapydProfile) => ({
      status: {
        status: 'SUCCESS'
      },
      data: {
        id: 'mocked',
        first_name: profile.first_name,
        last_name: profile.last_name
      }
    })
  }
}

const rapydFailResponse = () => ({
  status: {
    status: 'FAILURE',
    message: 'Test message for failure'
  }
})
export const mockFailureRapyd = {
  rapyd: {
    issueVirtualAccount: rapydFailResponse,
    simulateBankTransferToWallet: rapydFailResponse,
    withdrawFundsFromAccount: rapydFailResponse,
    getAccountsBalance: rapydFailResponse,
    getDocumentTypes: rapydFailResponse,
    getCountryNames: rapydFailResponse,
    createWallet: rapydFailResponse,
    verifyIdentity: rapydFailResponse,
    updateProfile: rapydFailResponse
  }
}

export const mockedRapydService = {
  getCountryNames: () => ({
    lable: faker.location.country(),
    value: faker.location.countryCode('alpha-2')
  }),
  getDocumentTypes: () => ({
    type: faker.lorem.slug(),
    name: faker.lorem.word(),
    isBackRequired: true
  }),
  createWallet: (input: Record<string, string>) => ({
    userId: input.id,
    wallet: 'mocked_wallet'
  }),

  verifyIdentity: () => ({
    id: uuid(),
    reference_id: uuid()
  }),
  updateProfile: () => ({
    email: faker.internet.email(),
    category: 'general',
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phone_number: faker.phone.number(),
    status: 'ACT',
    type: 'person'
  })
}
export const mockedRapydFailureService = {
  getCountryNames: jest
    .fn()
    .mockRejectedValueOnce(new Error('Unexpected error')),
  getDocumentTypes: jest
    .fn()
    .mockRejectedValueOnce(new Error('Unexpected error')),
  createWallet: jest.fn().mockRejectedValueOnce(new Error('Unexpected error')),
  verifyIdentity: jest
    .fn()
    .mockRejectedValueOnce(new Error('Unexpected error')),
  updateProfile: jest.fn().mockRejectedValueOnce(new Error('Unexpected error'))
}

export const mockedListAssets = [
  {
    code: 'BRG',
    createdAt: '2023-06-28T14:33:24.675Z',
    id: '9c498723-95fc-418e-becc-012205f8dff6',
    scale: 3,
    withdrawalThreshold: null
  },
  {
    code: 'CRS',
    createdAt: '2023-06-28T14:33:24.695Z',
    id: 'ca1d9728-d38f-47e6-a88e-3bfe9e60438e',
    scale: 4,
    withdrawalThreshold: null
  }
]

export const mockedAccount = {
  id: faker.string.uuid(),
  name: faker.string.uuid(),
  balance: faker.number,
  virtualAccountId: faker.string.uuid(),
  assetId: mockedListAssets[0].id,
  assetCode: mockedListAssets[0].code,
  assetScale: mockedListAssets[0].scale,
  paymentPointers: [],
  userId: faker.string.uuid(),
  createdAt: faker.string.uuid(),
  updatedAt: faker.string.uuid()
}

export const mockedAmount = {
  value: faker.number.bigInt(),
  assetCode: mockedListAssets[0].code,
  assetScale: mockedListAssets[0].scale
}

export const mockRapyd = {
  rapyd: {
    issueVirtualAccount: () => ({
      status: {
        status: 'SUCCESS'
      },
      data: {
        id: 'mocked'
      }
    }),
    simulateBankTransferToWallet: () => ({
      status: {
        status: 'SUCCESS'
      },
      data: {
        transactions: [
          {
            id: 'mocked'
          }
        ]
      }
    }),
    withdrawFundsFromAccount: () => ({
      status: {
        status: 'SUCCESS'
      },
      data: {
        id: 'mocked'
      }
    }),
    getAccountsBalance: () => ({
      data: [
        {
          currency: mockedListAssets[0].code,
          balance: 777
        }
      ] as Partial<RapydAccountBalance>
    })
  }
}

export const mockCreateAccountReq = {
  userId: faker.string.uuid(),
  name: faker.string.uuid(),
  assetId: mockedListAssets[0].id
}

export const generateMockedTransaction = (
  fields: PartialModelObject<Transaction> = {}
): PartialModelObject<Transaction> => ({
  id: faker.string.uuid(),
  paymentPointerId: faker.string.uuid(),
  accountId: faker.string.uuid(),
  paymentId: faker.string.uuid(),
  assetCode: mockedListAssets[0].code,
  value: faker.number.bigInt(),
  type: 'INCOMING',
  status: 'PENDING',
  description: faker.string.alpha(10),
  ...fields
})

export const mockedTransactionInsertObjs: Array<
  PartialModelObject<Transaction>
> = [
  generateMockedTransaction(),
  generateMockedTransaction(),
  generateMockedTransaction(),
  generateMockedTransaction({ type: 'OUTGOING' })
]
