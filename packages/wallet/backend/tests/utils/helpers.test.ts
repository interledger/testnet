import { applyScale } from '@/utils/helpers'

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
})
