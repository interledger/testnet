import { AxiosError } from 'axios'
import { z } from 'zod'
import $axios, { ErrorResponse, SuccessResponse } from '../axios'

export const fundAccountSchema = z.object({
  account: z.string().uuid(),
  amount: z.coerce
    .number({
      invalid_type_error: 'Please enter a valid amount'
    })
    .positive()
})

interface Service {
  fundAccount: (
    args: FundAccountArgs
  ) => Promise<SuccessResponse | FundAccountError | undefined>
}

type FundAccountArgs = z.infer<typeof fundAccountSchema>
type FundAccountError = ErrorResponse<typeof fundAccountSchema>

class AccountService implements Service {
  private static instance: AccountService

  static getInstance(): AccountService {
    if (!AccountService.instance) {
      AccountService.instance = new AccountService()
    }
    return AccountService.instance
  }

  async fundAccount(args: FundAccountArgs) {
    try {
      const response = await $axios.post<SuccessResponse>('/fund', args)
      return response.data
    } catch (e) {
      const error = e as AxiosError<FundAccountError>
      return error.response?.data
    }
  }
}

export const accountService = AccountService.getInstance()
