import { faker } from '@faker-js/faker'
import { logInSchema, signUpSchema } from '@/auth/validation'
import z from 'zod'
import { PartialModelObject } from 'objection'
import { Transaction } from '../src/transaction/model'

type LogInRequest = z.infer<typeof logInSchema>

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

export const mockedTransactionInsertObjs: Array<
  PartialModelObject<Transaction>
> = [
  {
    paymentPointerId: faker.string.uuid(),
    accountId: faker.string.uuid(),
    paymentId: faker.string.uuid(),
    assetCode: mockedListAssets[0].code,
    value: faker.number.bigInt(),
    type: 'INCOMING',
    status: 'PENDING',
    description: faker.string.alpha(10)
  },
  {
    paymentPointerId: faker.string.uuid(),
    accountId: faker.string.uuid(),
    paymentId: faker.string.uuid(),
    assetCode: mockedListAssets[0].code,
    value: faker.number.bigInt(),
    type: 'INCOMING',
    status: 'PENDING',
    description: faker.string.alpha(10)
  },
  {
    paymentPointerId: faker.string.uuid(),
    accountId: faker.string.uuid(),
    paymentId: faker.string.uuid(),
    assetCode: mockedListAssets[0].code,
    value: faker.number.bigInt(),
    type: 'INCOMING',
    status: 'PENDING',
    description: faker.string.alpha(10)
  },
  {
    paymentPointerId: faker.string.uuid(),
    accountId: faker.string.uuid(),
    paymentId: faker.string.uuid(),
    assetCode: mockedListAssets[0].code,
    value: faker.number.bigInt(),
    type: 'OUTGOING',
    status: 'PENDING',
    description: faker.string.alpha(10)
  }
]
