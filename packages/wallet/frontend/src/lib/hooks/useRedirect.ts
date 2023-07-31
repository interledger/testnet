import { useRouter } from 'next/router'
import { useCallback } from 'react'

export const useRedirect = <
  TQueryParams extends Record<string, unknown>,
  TFilters extends object = Partial<Record<keyof TQueryParams, string>>
>() => {
  const router = useRouter()
  const redirect = useCallback(
    (filters: TFilters) => {
      const query = {
        ...router.query
      }

      for (const [key, value] of Object.entries(filters) as [
        keyof TQueryParams,
        string
      ][]) {
        if (value === '') {
          delete query[key.toString()]
        } else {
          query[key.toString()] = value
        }
      }

      router.push(
        {
          pathname: '/transactions',
          query
        },
        undefined,
        { shallow: true }
      )
    },
    [router]
  )

  return redirect
}
