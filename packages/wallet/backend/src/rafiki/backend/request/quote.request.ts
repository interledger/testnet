import { gql } from 'graphql-request'

export const createQuoteMutation = gql`
  mutation CreateQuoteMutation($input: CreateQuoteInput!) {
    createQuote(input: $input) {
      quote {
        createdAt
        expiresAt
        id
        walletAddressId
        receiveAmount {
          assetCode
          assetScale
          value
        }
        receiver
        debitAmount {
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
      walletAddressId
      receiver
      debitAmount {
        value
        assetCode
        assetScale
      }
      receiveAmount {
        value
        assetCode
        assetScale
      }
      createdAt
      expiresAt
    }
  }
`
