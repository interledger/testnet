// Client only
import { useCallback } from 'react'
import { ErrorResponse, SuccessResponse } from '../axios'

export const useHttpRequest = () => {
  const sendRequest = useCallback(
    async <
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      C extends SuccessResponse<any> | ErrorResponse<any> | undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      T = any
    >(
      fn: (a: T) => Promise<C>,
      args: T
    ) => {
      const test = await fn(args)

      if (test?.success) {
        console.log('dispatch success')
      } else {
        console.log('dispatch error')
      }

      return test
    },
    []
  )

  return {
    sendRequest
  }
}
