import { type RefObject, useEffect } from 'react'

export const useOnClickOutside = (
  ref: RefObject<HTMLElement>,
  handler: (e?: MouseEvent | TouchEvent) => void
) => {
  useEffect(() => {
    const handleOnClickOutside = (e: MouseEvent | TouchEvent) => {
      if (!handler) return
      if (!ref.current || ref.current.contains(e.target as Node)) {
        return
      }

      handler(e)
    }

    document.addEventListener('mousedown', handleOnClickOutside)
    document.addEventListener('touchstart', handleOnClickOutside)

    return () => {
      document.addEventListener('mousedown', handleOnClickOutside)
      document.addEventListener('touchstart', handleOnClickOutside)
    }
  }, [ref, handler])
}
