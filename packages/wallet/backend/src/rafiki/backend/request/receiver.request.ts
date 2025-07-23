import { gql } from 'graphql-request'

export const createReceiverMutation = gql`
  mutation CreateReceiverMutation($input: CreateReceiverInput!) {
    createReceiver(input: $input) {
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
    }
  }
`
