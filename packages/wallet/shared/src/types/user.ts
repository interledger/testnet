import { z } from 'zod'

export interface UserResponse {
  email: string
  firstName: string
  lastName: string
  address: string
  needsWallet: boolean
  needsIDProof: boolean
}

export type ValidTokenResponse = {
  isValid: boolean
}

export const emailSchema = z.object({
  email: z.string().email({ message: 'Email is required' })
})
