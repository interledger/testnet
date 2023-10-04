import { faker } from '@faker-js/faker'
import { logInSchema, signUpSchema } from '@/auth/validation'
import z from 'zod'
import { PartialModelObject } from 'objection'
import { Transaction } from '../src/transaction/model'
import { quoteSchema } from '@/quote/validation'
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

type CreateQuoteRequest = z.infer<typeof quoteSchema>
export const mockCreateQuoteRequest = (
  overrides?: Partial<CreateQuoteRequest['body']>
): CreateQuoteRequest => {
  return {
    body: {
      receiver: faker.internet.url(),
      paymentPointerId: uuid(),
      amount: Number(faker.finance.amount({ dec: 0 })),
      isReceive: true,
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
