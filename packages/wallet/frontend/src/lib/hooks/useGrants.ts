import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GrantListArgs, grantsListSchema, grantsService } from '../api/grants'
import { GRANTS_DISPLAY_NR } from '@/utils/constants'
import { useTypedRouter } from './useTypedRouter'
import { GrantsListResponse, GRANTS_MAX_WALLET_ADDRESSES } from '@wallet/shared'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [grantsList, setGrantsList] = useState<GrantsListResponse>(defaultState)

  const canListAll =
    walletAddressIds.length > 0 &&
    walletAddressIds.length <= GRANTS_MAX_WALLET_ADDRESSES

  const filters = useMemo(() => {
    // No wallet address means All
    const isValidWalletAddress = walletAddressId
      ? walletAddressIds.includes(walletAddressId)
      : canListAll
    const fallbackWalletAddressId = canListAll ? undefined : walletAddressIds[0]

    return {
      walletAddressId: isValidWalletAddress
        ? walletAddressId
        : fallbackWalletAddressId,
      state,
      // Cursors are bound to their wallet addresses
      cursor: isValidWalletAddress ? cursor : undefined,
      direction: isValidWalletAddress ? direction : undefined,
      pageSize: pageSize ?? GRANTS_DISPLAY_NR,
      sortOrder: sortOrder ?? 'DESC'
    }
  }, [
    walletAddressId,
    walletAddressIds,
    canListAll,
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

  return [grantsList, filters, fetch, loading, error, canListAll] as const
}
