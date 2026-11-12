import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GrantListArgs, grantsListSchema, grantsService } from '../api/grants'
import { GRANTS_DISPLAY_NR } from '@/utils/constants'
import { useTypedRouter } from './useTypedRouter'
import { GrantsListResponse } from '@wallet/shared'

const defaultState: GrantsListResponse = {
  grants: [],
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false
  }
}

export const useGrants = (walletAddressIds: string[]) => {
  const router = useTypedRouter(grantsListSchema)
  const { walletAddressId, state, cursor, direction, pageSize, sortOrder } =
    router.query
  // Avoids flashing the empty state before the first fetch
  const [loading, setLoading] = useState(walletAddressIds.length > 0)
  const [error, setError] = useState<string | undefined>()
  const [grantsList, setGrantsList] = useState<GrantsListResponse>(defaultState)

  const filters = useMemo(() => {
    const isKnownWalletAddress =
      !!walletAddressId && walletAddressIds.includes(walletAddressId)

    return {
      walletAddressId: isKnownWalletAddress
        ? walletAddressId
        : walletAddressIds[0],
      state,
      // A cursor is only valid for the wallet address it was issued for
      cursor: isKnownWalletAddress ? cursor : undefined,
      direction: isKnownWalletAddress ? direction : undefined,
      pageSize: pageSize ?? GRANTS_DISPLAY_NR,
      sortOrder: sortOrder ?? 'DESC'
    }
  }, [
    walletAddressId,
    walletAddressIds,
    state,
    cursor,
    direction,
    pageSize,
    sortOrder
  ])

  const latestRequest = useRef(0)

  // Ignore responses superseded by a newer request
  const fetch = useCallback(async (args: GrantListArgs) => {
    const requestId = ++latestRequest.current

    if (!args.walletAddressId) {
      setGrantsList(defaultState)
      setLoading(false)
      setError(undefined)
      return
    }

    setLoading(true)
    setError(undefined)
    const response = await grantsService.list(args)

    if (requestId !== latestRequest.current) return

    if (response.success) {
      setGrantsList(response.result ?? defaultState)
    } else {
      setError(
        response.message ?? 'We encountered a network error. Please try again.'
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch(filters)
  }, [fetch, filters])

  return [grantsList, filters, fetch, loading, error] as const
}
