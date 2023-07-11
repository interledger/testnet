import { gql } from 'graphql-request'

export const createPaymentPointerMutation = gql`
  mutation CreatePaymentPointerMutation($input: CreatePaymentPointerInput!) {
    createPaymentPointer(input: $input) {
      code
      success
      message
      paymentPointer {
        id
        url
        publicName
      }
    }
  }
`

export const updatePaymentPointerMutation = gql`
    mutation UpdatePaymentPointerMutation($input: UpdatePaymentPointerInput!) {
        updatePaymentPointer(input: $input) {
            code
            success
            message
        }
    }
`
