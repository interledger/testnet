import { useCallback, useState } from 'react'
import { ErrorResponse, SuccessResponse } from '../httpClient'

export const useHttpRequest = () => {
  const [isLoading, setIsLoading] = useState(false)

  const sendRequest = useCallback(
    async <
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      TResponse extends SuccessResponse<any> | ErrorResponse<any> | undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      TArgs = any
    >(
      fn: (a: TArgs) => Promise<TResponse>,
      args: TArgs
    ) => {
      setIsLoading(true)
      const response = await fn(args)
      setIsLoading(false)

      return response
    },
    []
  )

  return [sendRequest, isLoading] as const
}
