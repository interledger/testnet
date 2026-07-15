import { OpenPaymentsClientError } from '@interledger/open-payments'
import { classifyError, isTooFast } from '@/errors'

function opError(args: {
  description?: string
  status?: number
  code?: string
}): OpenPaymentsClientError {
  return new OpenPaymentsClientError('failed', {
    description: args.description ?? '',
    status: args.status,
    code: args.code
  })
}

describe('classifyError', () => {
  it('classifies non-OP errors as other', () => {
    expect(classifyError(new Error('nope'))).toBe('other')
    expect(classifyError('a string')).toBe('other')
  })

  it('detects token expiry by 401, code, or description', () => {
    expect(classifyError(opError({ status: 401 }))).toBe('token_expired')
    expect(classifyError(opError({ code: 'invalid_token' }))).toBe(
      'token_expired'
    )
    expect(classifyError(opError({ description: 'token has expired' }))).toBe(
      'token_expired'
    )
    // Rafiki returns 403 "Inactive Token" (not 401) for an expired/revoked token.
    expect(
      classifyError(opError({ status: 403, description: 'Inactive Token' }))
    ).toBe('token_expired')
  })

  it('does not treat a generic 403 or inactive wallet address as token expiry', () => {
    expect(
      classifyError(opError({ status: 403, description: 'unauthorized' }))
    ).toBe('other')
    expect(
      classifyError(opError({ status: 400, description: 'inactive wallet address' }))
    ).toBe('other')
  })

  it('detects a locked grant', () => {
    expect(classifyError(opError({ description: 'grant locked' }))).toBe(
      'grant_locked'
    )
    expect(classifyError(opError({ code: 'grant_locked' }))).toBe(
      'grant_locked'
    )
  })

  it('detects insufficient liquidity', () => {
    expect(
      classifyError(opError({ description: 'insufficient liquidity' }))
    ).toBe('insufficient_liquidity')
  })

  it('detects an already-full / completed incoming payment', () => {
    expect(
      classifyError(opError({ description: 'receive amount exceeds' }))
    ).toBe('already_full')
    expect(
      classifyError(opError({ description: 'payment is completed' }))
    ).toBe('already_full')
    expect(
      classifyError(
        opError({ description: 'does not have a state that permits' })
      )
    ).toBe('already_full')
  })

  it('falls back to other', () => {
    expect(
      classifyError(opError({ description: 'weird error', status: 500 }))
    ).toBe('other')
  })
})

describe('isTooFast', () => {
  it('is true only for the too_fast GNAP code', () => {
    expect(isTooFast(opError({ code: 'too_fast' }))).toBe(true)
    expect(isTooFast(opError({ code: 'invalid_token' }))).toBe(false)
    expect(isTooFast(new Error('x'))).toBe(false)
  })
})
