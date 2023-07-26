import { useCallback, useEffect, useState } from 'react'
import { useHttpRequest } from './useHttp'
import { Transaction } from '../api/paymentPointer'
import { listTransactions } from '../api/transactions'

export const useTransactions = () => {
  const [request, loading, error] = useHttpRequest()
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const fetch = useCallback(
    async (filters: Record<string, string | number>) => {
      const response = await request(listTransactions, filters)
      if (response.success) {
        setTransactions(response.data ?? [])
      }
    },
    [request]
  )

  useEffect(() => {
    fetch({})
  }, [fetch])

  return [transactions, fetch, loading, error] as const
}
