import { gql } from 'graphql-request'

export const createIncomingPaymentMutation = gql`
  mutation CreateIncomingPaymentMutation($input: CreateIncomingPaymentInput!) {
    createIncomingPayment(input: $input) {
      payment {
        createdAt
        metadata
        expiresAt
        id
        incomingAmount {
          assetCode
          assetScale
          value
        }
        walletAddressId
        receivedAmount {
          assetCode
          assetScale
          value
        }
        state
      }
    }
  }
`
