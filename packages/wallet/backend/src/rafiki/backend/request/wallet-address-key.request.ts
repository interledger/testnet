import { gql } from 'graphql-request'

export const createWalletAddressKeyMutation = gql`
  mutation CreateWalletAddressKeyMutation(
    $input: CreateWalletAddressKeyInput!
  ) {
    createWalletAddressKey(input: $input) {
      code
      message
      success
      walletAddressKey {
        id
        walletAddressId
        revoked
        jwk {
          alg
          crv
          kid
          kty
          x
        }
        createdAt
      }
    }
  }
`

export const revokeWalletAddressKeyMutation = gql`
  mutation RevokeWalletAddressKeyMutation(
    $input: RevokeWalletAddressKeyInput!
  ) {
    revokeWalletAddressKey(input: $input) {
      code
      message
      success
      walletAddressKey {
        id
        revoked
        walletAddressId
        createdAt
      }
    }
  }
`
