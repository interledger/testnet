import { gql } from 'graphql-request'

export const createIncomingPaymentMutation = gql`
  mutation CreateIncomingPaymentMutation($input: CreateIncomingPaymentInput!) {
    createIncomingPayment(input: $input) {
      code
      message
      payment {
        createdAt
        description
        expiresAt
        externalRef
        id
        incomingAmount {
          assetCode
          assetScale
          value
        }
        paymentPointerId
        receivedAmount {
          assetCode
          assetScale
          value
        }
        state
      }
      success
    }
  }
`
