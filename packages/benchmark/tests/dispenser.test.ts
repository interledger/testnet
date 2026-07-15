import { Dispenser } from '@/dispenser'

describe('Dispenser', () => {
  it('rejects invalid targets', () => {
    expect(() => new Dispenser(-1)).toThrow()
    expect(() => new Dispenser(1.5)).toThrow()
  })

  it('claims exactly `target` reservations', () => {
    const d = new Dispenser(3)
    expect(d.claim()).toBe(true)
    expect(d.claim()).toBe(true)
    expect(d.claim()).toBe(true)
    expect(d.claim()).toBe(false)
    expect(d.remaining).toBe(0)
    expect(d.inflight).toBe(3)
  })

  it('is done only when everything is confirmed', () => {
    const d = new Dispenser(2)
    expect(d.done).toBe(false)
    d.claim()
    d.confirm()
    expect(d.done).toBe(false)
    d.claim()
    d.confirm()
    expect(d.done).toBe(true)
    expect(d.confirmed).toBe(2)
  })

  it('release returns a reservation to the pool for retry', () => {
    const d = new Dispenser(1)
    expect(d.claim()).toBe(true)
    d.release()
    expect(d.remaining).toBe(1)
    expect(d.inflight).toBe(0)
    // The released slot can be claimed and confirmed again.
    expect(d.claim()).toBe(true)
    d.confirm()
    expect(d.done).toBe(true)
  })

  it('never allows more than `target` concurrent reservations', () => {
    const d = new Dispenser(2)
    d.claim()
    d.claim()
    expect(d.claim()).toBe(false)
  })

  it('throws when confirming or releasing without a reservation', () => {
    const d = new Dispenser(1)
    expect(() => d.confirm()).toThrow()
    expect(() => d.release()).toThrow()
  })
})
