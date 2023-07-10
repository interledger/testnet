import { gql } from 'graphql-request'

export const createOutgoingPaymentMutation = gql`
  mutation CreateOutgoingPaymentMutation($input: CreateOutgoingPaymentInput!) {
    createOutgoingPayment(input: $input) {
      code
      message
      payment {
        createdAt
        metadata
        error
        id
        paymentPointerId
        quote {
          createdAt
          expiresAt
          highEstimatedExchangeRate
          id
          lowEstimatedExchangeRate
          maxPacketAmount
          minExchangeRate
          paymentPointerId
          receiveAmount {
            assetCode
            assetScale
            value
          }
          receiver
          sendAmount {
            assetCode
            assetScale
            value
          }
        }
        receiveAmount {
          assetCode
          assetScale
          value
        }
        receiver
        sendAmount {
          assetCode
          assetScale
          value
        }
        sentAmount {
          assetCode
          assetScale
          value
        }
        state
        stateAttempts
      }
      success
    }
  }
`
