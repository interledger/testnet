import { z } from 'zod'
import {
  getError,
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
type FundAccountError = ErrorResponse<FundAccountArgs | undefined>
type FundAccountResponse = Promise<SuccessResponse | FundAccountError>

interface AccountService {
  fundAccount: (args: FundAccountArgs) => Promise<FundAccountResponse>
}

const createAccountService = (): AccountService => ({
  async fundAccount(args: FundAccountArgs): Promise<FundAccountResponse> {
    try {
      const response = await httpClient
        .post('fund', {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<FundAccountArgs>(
        error,
        'We were unable to fund your account. Please try again.'
      )
    }
  }
})

export const accountService = createAccountService()
