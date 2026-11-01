import { webhookBodySchema } from '@/rhyza/validation'
import {
  mockPaymentCompletedEvent,
  mockPaymentIntentCompletedEvent
} from '../mocks'

describe('Rhyza webhook validation', () => {
  it('should accept a payment completed event and keep its metadata', () => {
    const event = mockPaymentCompletedEvent({
      data: { metadata: { type: 'instant' } }
    })

    const result = webhookBodySchema.safeParse({ body: event })

    expect(result.success).toBe(true)
    expect(result.data?.body.data.metadata).toEqual({ type: 'instant' })
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
})
