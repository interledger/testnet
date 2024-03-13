import { useCallback, useEffect, useState } from 'react'
import { useHttpRequest } from './useHttp'
import {
  TransactionsPage,
  transactionListQuerySchema,
  transactionService
} from '../api/transaction'
import { SelectOption } from '@/ui/forms/Select'
import { useTypedRouter } from './useTypedRouter'

type TransactionsQueryParams = Record<keyof TransactionsFilters, string | number>
const ORDER_DIRECTION = {
  ASC: 'ASC',
  DESC: 'DESC'
}
export type OrderByDirection = keyof typeof ORDER_DIRECTION

export type TransactionsFilters = {
  page: string
  pageSize: string
  accountId: SelectOption
  walletAddressId: SelectOption
  type: SelectOption
  status: SelectOption
  orderByDate: OrderByDirection
}

const defaultState = {
  results: [],
  total: 0
}

export const useTransactions = () => {
  const router = useTypedRouter(transactionListQuerySchema)
  const {
    accountId,
    walletAddressId,
    type,
    status,
    page,
    pageSize,
    orderByDate
  } = router.query as TransactionsQueryParams
  const [request, loading, error] = useHttpRequest()
  const [transactions, setTransactions] =
    useState<TransactionsPage>(defaultState)

  const fetch = useCallback(
    async (
      filters: Record<string, string | number>,
      pagination: Record<string, string | number>
    ) => {
      const response = await request(transactionService.list, {
        filters,
        pagination
      })
      if (response.success) {
        setTransactions(response.result ?? defaultState)
      }
    },
    [request]
  )

  useEffect(() => {
    fetch(
      {
        accountId,
        walletAddressId,
        type,
        status
      },
      {
        page: page ?? 0,
        pageSize: pageSize ?? 10,
        orderByDate: orderByDate ?? 'DESC'
      }
    )
  }, [
    fetch,
    accountId,
    walletAddressId,
    type,
    status,
    page,
    pageSize,
    orderByDate
  ])

  return [
    transactions,
    { accountId, walletAddressId, type, status },
    {
      page: page ?? 0,
      pageSize: pageSize ?? 10,
      orderByDate: orderByDate ?? 'DESC'
    },
    fetch,
    loading,
    error
  ] as const
}
