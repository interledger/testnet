import { faker } from '@faker-js/faker'
import { logInBodySchema, signUpBodySchema } from '@/auth/validation'
import z from 'zod'
import { PartialModelObject } from 'objection'
import { Transaction } from '../src/transaction/model'
import { quoteSchema } from '@/quote/validation'
import { uuid } from '@/tests/utils'
import { webhookBodySchema, WebhookType } from '@/rafiki/validation'
import { EventType, WebHook } from '@/rafiki/service'
import {
  incomingPaymentSchema,
  paymentDetailsSchema
} from '@/incomingPayment/validation'
import { outgoingPaymentSchema } from '@/outgoingPayment/validation'
import { ratesSchema } from '@/rates/validation'

export type LogInRequest = z.infer<typeof logInBodySchema>
export type GetRatesRequest = z.infer<typeof ratesSchema>
export type OnWebHook = z.infer<typeof webhookBodySchema>
export type IncomingPaymentCreated = z.infer<typeof incomingPaymentSchema>
export type IncomingPaymentRequest = z.infer<typeof incomingPaymentSchema>
export type GetPaymentDetailsByUrl = z.infer<typeof paymentDetailsSchema>

export const fakeLoginData = () => {
  return {
    email: faker.internet.email(),
    password: faker.internet.password({
      length: 20,
      // eslint-disable-next-line no-useless-escape
      pattern: /[0-9a-zA-Z`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/
    })
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

type SignUpRequest = z.infer<typeof signUpBodySchema>
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
      walletAddressId: uuid(),
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

export const mockedAccount = {
  id: faker.string.uuid(),
  name: faker.string.uuid(),
  balance: faker.number,
  gateHubWalletId: faker.string.uuid(),
  assetId: mockedListAssets[0].id,
  assetCode: mockedListAssets[0].code,
  assetScale: mockedListAssets[0].scale,
  walletAddresses: [],
  userId: faker.string.uuid(),
  createdAt: faker.string.uuid(),
  updatedAt: faker.string.uuid()
}

export const mockedAmount = {
  value: faker.number.bigInt(),
  assetCode: mockedListAssets[0].code,
  assetScale: mockedListAssets[0].scale
}

export const mockCreateAccountReq = {
  userId: faker.string.uuid(),
  name: faker.string.uuid(),
  assetId: mockedListAssets[0].id
}

export const mockedListGrant = [
  {
    id: faker.string.uuid(),
    client: faker.lorem.slug(),
    state: 'APPROVED',
    access: [
      {
        identifier: faker.internet.url(),
        limits: {
          receiver: null,
          debitAmount: {
            value: '12425',
            assetCode: 'USD',
            assetScale: 2
          },
          receiveAmount: {
            value: '12300',
            assetCode: 'USD',
            assetScale: 2
          },
          interval: 'R5/2008-03-01T13:00:00Z/P1Y2M10DT2H30M'
        }
      }
    ]
  },
  {
    id: faker.string.uuid(),
    client: faker.lorem.slug(),
    state: 'FINALIZED',
    access: [
      {
        identifier: faker.internet.url(),
        limits: {
          receiver: null,
          debitAmount: {
            value: '12425',
            assetCode: 'USD',
            assetScale: 2
          },
          receiveAmount: {
            value: '12300',
            assetCode: 'USD',
            assetScale: 2
          },
          interval: 'R/2016-08-23T08:00:00Z/P2Y'
        }
      }
    ],
    finalizationReason: 'REJECTED'
  }
]

export const generateMockedTransaction = (
  fields: PartialModelObject<Transaction> = {}
): PartialModelObject<Transaction> => ({
  id: faker.string.uuid(),
  walletAddressId: faker.string.uuid(),
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

export type OutgoingPayment = z.infer<typeof outgoingPaymentSchema>

export const mockOutgoingPaymentRequest = (
  overrides?: Partial<OutgoingPayment>
): OutgoingPayment => {
  return {
    body: {
      quoteId: 'ca1d9728-d38f-47e6-a88e-3bfe9e60438e'
    },
    ...overrides
  }
}

export const mockOutgoingPaymentService = {
  createByQuoteId: () => ({})
}

export const mockOutgoingPaymentFailureService = {
  createByQuoteId: jest
    .fn()
    .mockRejectedValueOnce(new Error('Unexpected error'))
}

export const mockGetRatesRequest = (
  overrides?: Partial<GetRatesRequest['query']>
): GetRatesRequest => {
  return {
    query: {
      base: faker.string.alpha(3).toUpperCase(),
      ...overrides
    }
  }
}

export const mockRatesService = {
  getRates: (base: string) => ({
    base: base,
    rates: {
      [faker.string.alpha(3).toUpperCase()]: faker.number.float(),
      [faker.string.alpha(3).toUpperCase()]: faker.number.float(),
      [faker.string.alpha(3).toUpperCase()]: faker.number.float()
    }
  })
}

const mockOutgoingPaymentData = {
  id: 'mockedId',
  walletAddressId: faker.string.uuid(),
  client: faker.string.uuid(),
  state: faker.string.uuid(),
  receiver: faker.string.uuid(),
  debitAmount: {
    value: 0,
    assetCode: 'USD',
    assetScale: 1
  },
  receiveAmount: {
    value: 0,
    assetCode: 'USD',
    assetScale: 1
  },
  sentAmount: {
    value: 0,
    assetCode: 'USD',
    assetScale: 1
  },
  stateAttempts: 0,
  createdAt: faker.string.uuid(),
  updatedAt: faker.string.uuid(),
  balance: '0',
  metadata: {
    description: 'Free Money!'
  },
  peerId: faker.string.uuid()
}

export const mockOnWebhookRequest = (
  overrides?: Partial<OnWebHook>
): OnWebHook => {
  return {
    body: {
      id: faker.string.alpha(10),
      type: EventType.IncomingPaymentCreated,
      data: {
        id: faker.string.alpha(10),
        walletAddressId: uuid(),
        createdAt: faker.string.uuid(),
        expiresAt: faker.string.uuid(),
        receivedAmount: {
          value: 0,
          assetCode: 'USD',
          assetScale: 1
        },
        completed: false,
        updatedAt: faker.string.uuid(),
        metadata: {
          description: 'Free Money!'
        }
      }
    },
    ...overrides
  }
}

export const mockRafikiService = {
  onWebHook: () => {}
}

export function mockOutgoingPaymentCreatedEvent(
  wh: Partial<WebHook>
): WebhookType {
  return {
    id: 'mockedId',
    type: wh.type || EventType.OutgoingPaymentCreated,
    data: wh.data || mockOutgoingPaymentData
  }
}

export function mockOutgoingPaymentCompletedEvent(
  wh: Partial<WebHook>
): WebhookType {
  return {
    id: 'mockedId',
    type: wh.type || EventType.OutgoingPaymentCompleted,
    data: wh.data || mockOutgoingPaymentData
  }
}

export function mockOutgoingPaymentFailedEvent(
  wh: Partial<WebHook>
): WebhookType {
  return {
    id: 'mockedId',
    type: wh.type || EventType.OutgoingPaymentFailed,
    data: wh.data || mockOutgoingPaymentData
  }
}

export function mockIncomingPaymentCreatedEvent(
  wh: Partial<WebHook>
): WebhookType {
  return {
    id: 'mockedId',
    type: wh.type || EventType.IncomingPaymentCreated,
    data: wh.data || {
      id: 'mockedId',
      walletAddressId: faker.string.uuid(),
      createdAt: faker.string.uuid(),
      expiresAt: faker.string.uuid(),
      receivedAmount: {
        value: 0,
        assetCode: 'USD',
        assetScale: 1
      },
      completed: false,
      updatedAt: faker.string.uuid(),
      metadata: {
        description: 'Free Money!'
      }
    }
  }
}

export function mockIncomingPaymentRequest(
  overrides?: Partial<IncomingPaymentCreated['body']>
): IncomingPaymentCreated {
  return {
    body: {
      walletAddressId: faker.string.uuid(),
      amount: Number(faker.finance.amount({ dec: 0 })),
      description: faker.lorem.paragraph(2),
      expiration: {
        value: 1,
        unit: 'h'
      },
      ...overrides
    }
  }
}

export type IncomingPaymentRequestSession = {
  user: {
    id: string
    email: string
    needsWallet: boolean
    needsIDProof: boolean
  }
}

export function mockIncomingPaymentRequestSession(
  overrides?: Partial<IncomingPaymentRequestSession>
) {
  return {
    user: {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      needsWallet: false,
      needsIDProof: false
    },
    ...overrides
  }
}

export function mockIncomingPaymentGetPaymentDetailsByUrlRequest(
  overrides?: Partial<GetPaymentDetailsByUrl['query']>
): GetPaymentDetailsByUrl {
  return {
    query: {
      url: '/testpath/incoming-payments/12345678-1234-1234-1234-123456789012',
      ...overrides
    }
  }
}

export const mockIncomingPaymentService = {
  create: () => 'https://www.some-domain.com',
  getPaymentDetailsByUrl: () => ({
    value: faker.number.float(),
    description: faker.lorem.paragraph(2),
    assetCode: 'USD'
  })
}

export const mockWalletAddress = {
  id: faker.string.uuid(),
  url: faker.internet.url(),
  publicName: faker.lorem.words({ max: 2, min: 2 }),
  active: true
}

export const mockExternalPayment = {
  receivedAmount: { value: '0', assetCode: 'EUR', assetScale: 1 },
  authServer: 'http://rafiki-auth:3006'
}

export const mockGateHubClient = {
  createManagedUser: () => faker.string.uuid(),
  createWallet: () => ({
    address: faker.string.uuid()
  }),
  connectUserToGateway: () => {},
  getWalletBalance: () => []
}
