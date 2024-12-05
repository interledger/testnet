import { gql } from 'graphql-request'
import { OutgoingPayment } from '../generated/graphql'

export const createOutgoingPaymentMutation = gql`
  mutation CreateOutgoingPaymentMutation($input: CreateOutgoingPaymentInput!) {
    createOutgoingPayment(input: $input) {
      payment {
        createdAt
        metadata
        error
        id
        walletAddressId
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
        sentAmount {
          assetCode
          assetScale
          value
        }
        state
        stateAttempts
      }
    }
  }
`

export const getOutgoingPayments = gql`
  query GetOutgoingPaymentsQuery(
    $filter: OutgoingPaymentFilter
    $after: String
    $before: String
    $first: Int
    $last: Int
  ) {
    outgoingPayments(
      filter: $filter
      after: $after
      before: $before
      first: $first
      last: $last
    ) {
      edges {
        cursor
        node {
          id
          walletAddressId
          receiver
          grantId
          sentAmount {
            assetCode
            assetScale
            value
          }
          state
          createdAt
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
`

export type OutgoingPaymentsGqlResponse = Pick<
  OutgoingPayment,
  | 'id'
  | 'walletAddressId'
  | 'receiver'
  | 'grantId'
  | 'sentAmount'
  | 'state'
  | 'createdAt'
>
