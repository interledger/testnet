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

export const getIncomingPaymentQuery = gql`
  query GetIncomingPaymentQuery($id: String!) {
    incomingPayment(id: $id) {
      id
      paymentPointerId
      state
      expiresAt
      incomingAmount {
        value
        assetCode
        assetScale
      }
      receivedAmount {
        value
        assetCode
        assetScale
      }
      metadata
      createdAt
    }
  }
`
