import { useRouter } from 'next/router'
import { useCallback } from 'react'

type RedirectArgs = {
  path: string
  persistQuery: boolean
}
export const useRedirect = <
  TQueryParams extends Record<string, unknown>,
  TFilters extends object = Partial<Record<keyof TQueryParams, string | number>>
>(
  redirectArgs: RedirectArgs
) => {
  const router = useRouter()
  const redirect = useCallback(
    (filters: TFilters) => {
      const query = redirectArgs.persistQuery
        ? {
            ...router.query
          }
        : {}

      for (const [key, value] of Object.entries(filters) as [
        keyof TQueryParams,
        string
      ][]) {
        if (value === '' || value === undefined) {
          delete query[key.toString()]
        } else {
          query[key.toString()] = value
        }
      }

      router.push(
        {
          pathname: redirectArgs.path,
          query
        },
        undefined,
        { shallow: true }
      )
    },
    [router, redirectArgs.path, redirectArgs.persistQuery]
  )

  return redirect
}
