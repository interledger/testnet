import { gql } from 'graphql-request'

export const createQuoteMutation = gql`
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

export const getQuoteQuery = gql`
  query GetQuoteQuery($quoteId: String!) {
    quote(id: $quoteId) {
      id
      paymentPointerId
      receiver
      sendAmount {
        value
        assetCode
        assetScale
      }
      receiveAmount {
        value
        assetCode
        assetScale
      }
      maxPacketAmount
      minExchangeRate
      lowEstimatedExchangeRate
      highEstimatedExchangeRate
      createdAt
      expiresAt
    }
  }
`

console.log(getQuoteQuery)
