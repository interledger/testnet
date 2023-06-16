import { gql } from 'graphql-request'

export const createPaymentPointerKeyMutation = gql`
  mutation CreatePaymentPointerKeyMutation(
    $input: CreatePaymentPointerKeyInput!
  ) {
    createPaymentPointerKey(input: $input) {
      code
      message
      success
      paymentPointerKey {
        id
        paymentPointerId
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
