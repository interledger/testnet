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
        walletAddressUrl
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

export const getReceiverQuery = gql`
  query GetReceiverQuery($id: String!) {
    receiver(id: $id) {
      completed
      createdAt
      expiresAt
      metadata
      id
      incomingAmount {
        assetCode
        assetScale
        value
      }
      walletAddressUrl
      receivedAmount {
        assetCode
        assetScale
        value
      }
      updatedAt
    }
  }
`
