import { runPool } from '@/pool'

describe('runPool', () => {
  it('rejects invalid worker counts', async () => {
    await expect(runPool(0, async () => {})).rejects.toThrow()
    await expect(runPool(1.5, async () => {})).rejects.toThrow()
  })

  it('runs the requested number of workers with their ids', async () => {
    const ids: number[] = []
    await runPool(4, async (id) => {
      ids.push(id)
    })
    expect(ids.sort()).toEqual([0, 1, 2, 3])
  })

  it('runs workers concurrently', async () => {
    let active = 0
    let maxActive = 0
    await runPool(3, async () => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise((r) => setTimeout(r, 5))
      active -= 1
    })
    expect(maxActive).toBe(3)
  })

  it('rethrows the first worker error after awaiting all', async () => {
    let finished = 0
    await expect(
      runPool(3, async (id) => {
        await new Promise((r) => setTimeout(r, 5))
        finished += 1
        if (id === 1) {
          throw new Error('boom')
        }
      })
    ).rejects.toThrow('boom')
    // All workers ran to completion despite the rejection.
    expect(finished).toBe(3)
  })
})
