import { faker } from '@faker-js/faker'
import { logInSchema, signUpSchema } from '@/auth/validation'
import z from 'zod'
import { PartialModelObject } from 'objection'
import { Transaction } from '../src/transaction/model'

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
