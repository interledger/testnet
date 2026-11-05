import { applyScale, toBaseUnits } from '@/utils/helpers'
import { BadRequest } from '@shared/backend'

describe('Utils Helper Functions', (): void => {
  describe('applyScale', (): void => {
    it('should correctly scale amounts with scale of 2', (): void => {
      // Test various cases
      expect(applyScale(1000, 2)).toBe(10)
      expect(applyScale(1500, 2)).toBe(15)
      expect(applyScale(1550, 2)).toBe(15.5)
      expect(applyScale(1555, 2)).toBe(15.55)
      expect(applyScale(1, 2)).toBe(0.01)
    })

    it('should handle zero correctly', (): void => {
      expect(applyScale(0, 2)).toBe(0)
    })

    it('should use default scale if not provided', (): void => {
      expect(applyScale(1000)).toBe(10)
    })
  })

  describe('toBaseUnits', (): void => {
    it('converts to base units, absorbing float error', (): void => {
      expect(toBaseUnits(10, 2)).toBe(1000n)
      expect(toBaseUnits(0.29, 2)).toBe(29n)
      expect(toBaseUnits(1.005, 3)).toBe(1005n)
    })

    it('rejects amounts that round to zero', (): void => {
      expect(() => toBaseUnits(0.001, 2)).toThrow(BadRequest)
    })

    it('rejects amounts above the safe integer range', (): void => {
      expect(() => toBaseUnits(1e14, 3)).toThrow(BadRequest)
      expect(() => toBaseUnits(1e19, 2)).toThrow(BadRequest)
    })
  })
})
