import { useHttpRequest } from './useHttp'
import { useCallback, useEffect, useState } from 'react'
import {
  GrantListArgs,
  GrantsList,
  grantsListSchema,
  grantsService
} from '../api/grants'
import { GRANTS_DISPLAY_NR } from '@/utils/constants'
import { useTypedRouter } from './useTypedRouter'

type GrantQueryParams = Record<keyof GrantListArgs, string | number>

const defaultState = {
  grants: {
    edges: [],
    pageInfo: {
      endCursor: '',
      startCursor: '',
      hasNextPage: false,
      hasPreviousPage: false
    }
  }
}

export const useGrants = () => {
  const router = useTypedRouter(grantsListSchema)
  const { after, before, first, last } = router.query as GrantQueryParams
  const [request, loading, error] = useHttpRequest()
  const [grantsList, setGrantsList] = useState<GrantsList>(defaultState)

  const fetch = useCallback(
    async (pagination: Record<string, string | number>) => {
      const response = await request(grantsService.list, pagination)
      if (response.success) {
        setGrantsList(response.result ?? defaultState)
      }
    },
    [request]
  )

  useEffect(() => {
    fetch({
      after,
      before,
      first: first ?? GRANTS_DISPLAY_NR,
      last
    })
  }, [fetch, after, before, first, last])

  return [
    grantsList,
    { after, before, first, last },
    fetch,
    loading,
    error
  ] as const
}
