import { useCallback, useEffect, useState } from 'react'
import { useHttpRequest } from './useHttp'
import { TransactionsPage, transactionService } from '../api/transaction'
import { useRouter } from 'next/router'
import { SelectOption } from '@/ui/forms/Select'

type TransactionsQueryParams = Record<keyof TransactionsFilters, string>

export type TransactionsFilters = {
  page: string
  accountId: SelectOption
  paymentPointerId: SelectOption
  type: SelectOption
  status: SelectOption
}

const defaultState = {
  results: [],
  total: 0
}

export const useTransactions = () => {
  const router = useRouter()
  const { accountId, paymentPointerId, type, status, page } =
    router.query as TransactionsQueryParams
  const [request, loading, error] = useHttpRequest()
  const [transactions, setTransactions] =
    useState<TransactionsPage>(defaultState)

  const fetch = useCallback(
    async (
      filters: Record<string, string>,
      pagination: Record<string, string>
    ) => {
      const response = await request(transactionService.list, {
        filters,
        pagination
      })
      if (response.success) {
        setTransactions(response.data ?? defaultState)
      }
    },
    [request]
  )

  useEffect(() => {
    fetch(
      {
        accountId,
        paymentPointerId,
        type,
        status
      },
      { page: page ?? 0 }
    )
  }, [fetch, accountId, paymentPointerId, type, status, page])

  return [
    transactions,
    { accountId, paymentPointerId, type, status },
    { page: page ?? 0 },
    fetch,
    loading,
    error
  ] as const
}
