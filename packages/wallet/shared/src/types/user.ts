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
