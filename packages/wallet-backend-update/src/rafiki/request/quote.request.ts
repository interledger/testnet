import { gql } from 'graphql-request'

export const createIncomingPaymentMutation = gql`
  mutation CreateQuoteMutation($input: CreateQuoteInput!) {
    createQuote(input: $input) {
      code
      message
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
    }
  }
`
