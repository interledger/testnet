import { SuccessResponse, getError, httpClient } from '../httpClient'
import { Transaction } from './paymentPointer'

// This is weird ...
// Ref: https://github.com/microsoft/TypeScript/issues/54466
declare global {
  interface URLSearchParams {
    size: number
  }
}

export const listTransactions = async (
  filters?: Record<string, string | number>
) => {
  const params = new URLSearchParams()
  for (const key in filters) {
    if (typeof filters[key] !== 'undefined') {
      params.append(`filter[${key}]`, filters[key].toString())
    }
  }

  try {
    const response = await httpClient
      .get(`transactions${params.size > 0 ? `?${params}` : ``}`, {
        retry: 0
      })
      .json<SuccessResponse<Transaction[]>>()
    return response
  } catch (error) {
    return getError(error, 'Unable to fetch payment pointers.')
  }
}
