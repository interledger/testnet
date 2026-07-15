import { OpenPaymentsClientError } from '@interledger/open-payments'
import type { WalletAddress } from '@interledger/open-payments'
import { obtainGrant } from '@/grant'
import type { BenchmarkClient } from '@/open-payments'

const payer = {
  id: 'https://wallet/alice',
  authServer: 'https://auth'
} as unknown as WalletAddress

const debitAmount = { value: '1000', assetCode: 'EUR', assetScale: 2 }
const pending = {
  redirect: 'https://consent',
  continueUri: 'https://continue',
  continueToken: 'ctok',
  wait: 1
}

function tooFast(): OpenPaymentsClientError {
  return new OpenPaymentsClientError('too fast', {
    description: 'too fast',
    code: 'too_fast'
  })
}

describe('obtainGrant', () => {
  it('returns the token when approved on the first poll', async () => {
    const client = {
      requestOutgoingPaymentGrant: jest.fn().mockResolvedValue(pending),
      continueGrant: jest
        .fn()
        .mockResolvedValue({ accessToken: 'atok', manageUrl: 'https://manage' })
    } as unknown as BenchmarkClient
    const prompt = jest.fn()

    const grant = await obtainGrant({
      client,
      payer,
      debitAmount,
      prompt,
      sleep: jest.fn().mockResolvedValue(undefined),
      now: () => 0
    })

    expect(prompt).toHaveBeenCalledWith('https://consent')
    expect(grant).toEqual({
      accessToken: 'atok',
      manageUrl: 'https://manage',
      continueUri: 'https://continue'
    })
  })

  it('polls until the grant is approved', async () => {
    const continueGrant = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ accessToken: 'atok' })
    const client = {
      requestOutgoingPaymentGrant: jest.fn().mockResolvedValue(pending),
      continueGrant
    } as unknown as BenchmarkClient

    const grant = await obtainGrant({
      client,
      payer,
      debitAmount,
      prompt: jest.fn(),
      log: jest.fn(),
      sleep: jest.fn().mockResolvedValue(undefined),
      now: () => 0
    })

    expect(continueGrant).toHaveBeenCalledTimes(2)
    expect(grant.accessToken).toBe('atok')
  })

  it('retries after a too_fast error', async () => {
    const continueGrant = jest
      .fn()
      .mockRejectedValueOnce(tooFast())
      .mockResolvedValueOnce({ accessToken: 'atok' })
    const client = {
      requestOutgoingPaymentGrant: jest.fn().mockResolvedValue(pending),
      continueGrant
    } as unknown as BenchmarkClient

    const grant = await obtainGrant({
      client,
      payer,
      debitAmount,
      prompt: jest.fn(),
      sleep: jest.fn().mockResolvedValue(undefined),
      now: () => 0
    })

    expect(continueGrant).toHaveBeenCalledTimes(2)
    expect(grant.accessToken).toBe('atok')
  })

  it('rethrows non-too_fast continuation errors', async () => {
    const client = {
      requestOutgoingPaymentGrant: jest.fn().mockResolvedValue(pending),
      continueGrant: jest.fn().mockRejectedValue(new Error('server down'))
    } as unknown as BenchmarkClient

    await expect(
      obtainGrant({
        client,
        payer,
        debitAmount,
        prompt: jest.fn(),
        sleep: jest.fn().mockResolvedValue(undefined),
        now: () => 0
      })
    ).rejects.toThrow('server down')
  })

  it('throws when the approval times out', async () => {
    let t = 0
    const client = {
      requestOutgoingPaymentGrant: jest.fn().mockResolvedValue(pending),
      continueGrant: jest.fn().mockResolvedValue(null)
    } as unknown as BenchmarkClient

    await expect(
      obtainGrant({
        client,
        payer,
        debitAmount,
        prompt: jest.fn(),
        sleep: jest.fn().mockResolvedValue(undefined),
        timeoutMs: 100,
        // First call computes the deadline (t=0 → deadline 100); the loop check
        // then sees t beyond the deadline.
        now: () => {
          const v = t
          t += 1000
          return v
        }
      })
    ).rejects.toThrow(/Timed out/)
  })
})
