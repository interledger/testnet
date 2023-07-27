import { useCallback, useState } from 'react'
import { ErrorResponse, SuccessResponse } from '../httpClient'

export const useHttpRequest = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const sendRequest = useCallback(
    async <
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      TResponse extends SuccessResponse<any> | ErrorResponse<any>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      TArgs = any
    >(
      fn: (a?: TArgs) => Promise<TResponse>,
      args: TArgs
    ) => {
      setError(undefined)
      setIsLoading(true)
      const response = await fn(args)
      if (!response?.success) {
        setError(
          response?.message ??
            'We encountered a network error. Please try again!'
        )
      }
      setIsLoading(false)

      return response
    },
    []
  )

  return [sendRequest, isLoading, error] as const
}
