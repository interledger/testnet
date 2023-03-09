import { HTTPError } from 'ky'
import { z } from 'zod'
import {
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'

export const fundAccountSchema = z.object({
  account: z.string().uuid(),
  amount: z.coerce
    .number({
      invalid_type_error: 'Please enter a valid amount'
    })
    .positive()
})

type FundAccountArgs = z.infer<typeof fundAccountSchema>
type FundAccountError = ErrorResponse<typeof fundAccountSchema>

interface AccountService {
  fundAccount: (
    args: FundAccountArgs
  ) => Promise<SuccessResponse | FundAccountError>
}

const createAccountService = (): AccountService => ({
  async fundAccount(args: FundAccountArgs) {
    try {
      const response = await httpClient
        .post('fund', {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (e) {
      const error = e as HTTPError
      return error.response.json() as Promise<FundAccountError>
    }
  }
})

export const accountService = createAccountService()
