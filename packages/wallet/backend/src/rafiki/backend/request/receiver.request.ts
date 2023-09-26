import { gql } from 'graphql-request'

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
