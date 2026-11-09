import { faker } from '@faker-js/faker'
import { webhookBodySchema } from '@/rhyza/validation'
import {
  mockPaymentCompletedEvent,
  mockPaymentCreatedEvent,
  mockPaymentFailedEvent,
  mockPaymentIntentCompletedEvent
} from '../mocks'

describe('Rhyza webhook validation', () => {
  it('should accept a payment completed event and keep its metadata', () => {
    const event = mockPaymentCompletedEvent({
      data: { metadata: { type: 'instant' } }
    })

    const result = webhookBodySchema.safeParse({ body: event })

    expect(result.success).toBe(true)
    expect(result.data?.body).toMatchObject({
      data: { metadata: { type: 'instant' } }
    })
  })

  it('should accept a payment failed event without amounts or wallet address', () => {
    const result = webhookBodySchema.safeParse({
      body: mockPaymentFailedEvent()
    })

    expect(result.success).toBe(true)
  })

  it('should accept a payment failed event with a sent amount', () => {
    const result = webhookBodySchema.safeParse({
      body: mockPaymentFailedEvent({
        data: {
          walletAddressId: faker.string.uuid(),
          sentAmount: { value: '500', assetCode: 'USD', assetScale: 2 }
        }
      })
    })

    expect(result.success).toBe(true)
  })

  it('should reject a payment created event without a payment intent id', () => {
    const event = mockPaymentCreatedEvent()
    delete (event.data as { paymentIntentId?: string }).paymentIntentId

    const result = webhookBodySchema.safeParse({ body: event })

    expect(result.success).toBe(false)
  })

  it('should still accept a payment intent completed event', () => {
    const result = webhookBodySchema.safeParse({
      body: mockPaymentIntentCompletedEvent()
    })

    expect(result.success).toBe(true)
  })

  it.each(['debitAmount', 'walletAddressId', 'state'])(
    'should reject a payment completed event without %s',
    (field) => {
      const event = mockPaymentCompletedEvent()
      delete (event.data as Record<string, unknown>)[field]

      const result = webhookBodySchema.safeParse({ body: event })

      expect(result.success).toBe(false)
    }
  )

  it('should reject an unsupported event type', () => {
    const event = { ...mockPaymentCompletedEvent(), type: 'unknown.event' }

    const result = webhookBodySchema.safeParse({ body: event })

    expect(result.success).toBe(false)
  })

  it('should create a payment event', () => {
    const result = webhookBodySchema.safeParse({
      body: mockPaymentCreatedEvent()
    })

    expect(result.success).toBe(true)
  })

  const createGrantRevokedEvent = (
    limits: Record<string, string | number>,
    client?: string | Record<string, string>
  ) => ({
    id: '86f1c0c6-53d7-4e15-88e7-110ad7f35c11',
    type: 'grant.revoked',
    data: {
      id: '5f8ad5a1-d4e2-4595-8f02-d68a69055945',
      createdAt: '2026-01-01T00:00:00Z',
      status: 'PROCESSING',
      access: [
        {
          type: 'INCOMING_PAYMENT',
          actions: ['CREATE'],
          identifier: 'identifier',
          limits
        }
      ],
      client,
      subjectIds: [
        {
          format: 'format',
          id: 'subject-id'
        }
      ]
    }
  })

  it.each([
    [
      'receiveAmount with string client',
      {
        receiver: 'receiver',
        assetCode: 'USD',
        assetScale: 2,
        receiveAmount: '1000'
      },
      'client-id'
    ],
    [
      'debitAmount with JWK client',
      {
        receiver: 'receiver',
        assetCode: 'USD',
        assetScale: 2,
        debitAmount: '1000'
      },
      {
        alg: 'ES256',
        crv: 'P-256',
        kid: 'key-id',
        kty: 'EC',
        use: 'sig',
        x: 'public-key'
      }
    ],
    [
      'both amount limits without client',
      {
        receiver: 'receiver',
        assetCode: 'USD',
        assetScale: 2,
        debitAmount: '1000',
        receiveAmount: '1000'
      },
      undefined
    ]
  ])(
    'should accept a grant revoked event with %s',
    (_description, limits, client) => {
      const event = createGrantRevokedEvent(limits, client)
      const result = webhookBodySchema.safeParse({ body: event })

      expect(result.success).toBe(true)
    }
  )

  it('should reject a grant revoked event when neither amount limit is provided', () => {
    const event = createGrantRevokedEvent({
      receiver: 'receiver',
      assetCode: 'USD',
      assetScale: 2
    })
    const result = webhookBodySchema.safeParse({ body: event })

    expect(result.success).toBe(false)
  })
})
