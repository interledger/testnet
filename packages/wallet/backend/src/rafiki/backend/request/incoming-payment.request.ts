import { gql } from 'graphql-request'

export const createIncomingPaymentMutation = gql`
  mutation CreateIncomingPaymentMutation($input: CreateIncomingPaymentInput!) {
    createIncomingPayment(input: $input) {
      code
      message
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

export const createReceiverMutation = gql`
  mutation CreateReceiverMutation($input: CreateReceiverInput!) {
    createReceiver(input: $input) {
      code
      message
      receiver {
        createdAt
        metadata
        expiresAt
        id
        incomingAmount {
          assetCode
          assetScale
          value
        }
        paymentPointerUrl
        receivedAmount {
          assetCode
          assetScale
          value
        }
      }
      success
    }
  }
`
