import { RotatingToken } from '@/rotating-token'

describe('RotatingToken', () => {
  it('exposes the initial value', () => {
    const token = new RotatingToken(
      { value: 'a', manageUrl: 'm' },
      async () => ({
        value: 'b'
      })
    )
    expect(token.current()).toBe('a')
  })

  it('rotates once and updates the current value', async () => {
    const rotateFn = jest
      .fn()
      .mockResolvedValue({ value: 'b', manageUrl: 'm2' })
    const token = new RotatingToken({ value: 'a', manageUrl: 'm1' }, rotateFn)

    const next = await token.rotate('a')

    expect(next).toBe('b')
    expect(token.current()).toBe('b')
    expect(rotateFn).toHaveBeenCalledWith('m1', 'a')
  })

  it('coalesces concurrent rotations into a single call', async () => {
    let resolveRotate: (v: { value: string }) => void = () => {}
    const rotateFn = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRotate = resolve
        })
    )
    const token = new RotatingToken({ value: 'a', manageUrl: 'm' }, rotateFn)

    const p1 = token.rotate('a')
    const p2 = token.rotate('a')
    resolveRotate({ value: 'b' })
    const [r1, r2] = await Promise.all([p1, p2])

    expect(rotateFn).toHaveBeenCalledTimes(1)
    expect(r1).toBe('b')
    expect(r2).toBe('b')
  })

  it('does not rotate when the caller used a stale value', async () => {
    const rotateFn = jest.fn().mockResolvedValue({ value: 'c' })
    const token = new RotatingToken({ value: 'b', manageUrl: 'm' }, rotateFn)

    const result = await token.rotate('a') // 'a' is stale; current is 'b'

    expect(rotateFn).not.toHaveBeenCalled()
    expect(result).toBe('b')
  })

  it('throws when rotation is needed but no manage URL exists', async () => {
    const token = new RotatingToken({ value: 'a' }, async () => ({
      value: 'b'
    }))
    await expect(token.rotate('a')).rejects.toThrow('no manage URL')
  })

  it('allows a subsequent rotation after the first completes', async () => {
    const rotateFn = jest
      .fn()
      .mockResolvedValueOnce({ value: 'b', manageUrl: 'm2' })
      .mockResolvedValueOnce({ value: 'c', manageUrl: 'm3' })
    const token = new RotatingToken({ value: 'a', manageUrl: 'm1' }, rotateFn)

    await token.rotate('a')
    await token.rotate('b')

    expect(token.current()).toBe('c')
    expect(rotateFn).toHaveBeenCalledTimes(2)
  })
})
