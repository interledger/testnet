import { gql } from 'graphql-request'

export const createPaymentPointerKeyMutation = gql`
  mutation CreatePaymentPointerKeyMutation(
    $input: CreatePaymentPointerKeyInput!
  ) {
    createPaymentPointerKey(input: $input) {
      code
      success
      message
      paymentPointerKey {
        id
        url
        publicName
      }
    }
  }
`
