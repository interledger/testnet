import { percentile, max, sleep } from '@/util'

describe('percentile', () => {
  it('returns 0 for an empty set', () => {
    expect(percentile([], 50)).toBe(0)
  })

  it('computes nearest-rank percentiles', () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    expect(percentile(values, 50)).toBe(50)
    expect(percentile(values, 95)).toBe(100)
    expect(percentile(values, 100)).toBe(100)
  })

  it('does not mutate the input array', () => {
    const values = [3, 1, 2]
    percentile(values, 50)
    expect(values).toEqual([3, 1, 2])
  })

  it('handles the 0th percentile as the smallest element', () => {
    expect(percentile([5, 1, 9], 0)).toBe(1)
  })
})

describe('max', () => {
  it('returns 0 for an empty set', () => {
    expect(max([])).toBe(0)
  })

  it('returns the largest value', () => {
    expect(max([3, 9, 2])).toBe(9)
  })
})

describe('sleep', () => {
  it('resolves after the given delay', async () => {
    jest.useFakeTimers()
    let resolved = false
    const p = sleep(100).then(() => {
      resolved = true
    })
    jest.advanceTimersByTime(100)
    await p
    expect(resolved).toBe(true)
    jest.useRealTimers()
  })
})
