import { useEffect, useRef, useState } from 'react'

function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  const lastValue = useRef<T>(value)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (value !== '' && lastValue.current !== value) {
      setIsLoading(true)
      const handler = setTimeout(() => {
        setDebouncedValue(value)
        setIsLoading(false)
      }, delay)

      return () => {
        clearTimeout(handler)
      }
    }
  }, [value, delay])
  return [debouncedValue, isLoading] as const
}

export { useDebounce }
