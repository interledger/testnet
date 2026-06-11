import { useHttpRequest } from './useHttp'
import { useCallback, useEffect, useState } from 'react'
import { GrantListArgs, grantsListSchema, grantsService } from '../api/grants'
import { GRANTS_DISPLAY_NR } from '@/utils/constants'
import { useTypedRouter } from './useTypedRouter'
import { GrantsListResponse } from '@wallet/shared'

type GrantQueryParams = Record<keyof GrantListArgs, string | number>

const defaultState = {
  grants: {
    edges: [],
    pageInfo: {
      endCursor: '',
      startCursor: '',
      hasNextPage: false,
      hasPreviousPage: false,
      totalCount: 0
    }
  }
}

export const useGrants = () => {
  const router = useTypedRouter(grantsListSchema)
  const { page, pageSize, sortOrder } = router.query as GrantQueryParams
  const [request, loading, error] = useHttpRequest()
  const [grantsList, setGrantsList] = useState<GrantsListResponse>(defaultState)

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
      page: page ?? 0,
      pageSize: pageSize ?? GRANTS_DISPLAY_NR,
      sortOrder: sortOrder ?? 'DESC'
    })
  }, [fetch, page, pageSize, sortOrder])

  return [
    grantsList,
    {
      page: page ?? 0,
      pageSize: pageSize ?? GRANTS_DISPLAY_NR,
      sortOrder: sortOrder ?? 'DESC'
    },
    fetch,
    loading,
    error
  ] as const
}
