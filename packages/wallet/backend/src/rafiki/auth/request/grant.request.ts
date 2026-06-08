import { gql } from 'graphql-request'

export const getGrantsQuery = gql`
  query GetGrantsQuery($filter: GrantFilter, $sortOrder: SortOrder) {
    grants(filter: $filter, sortOrder: $sortOrder) {
      edges {
        cursor
        node {
          id
          client
          state
          finalizationReason
          access {
            id
            identifier
            createdAt
            actions
            type
            limits {
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
              interval
            }
          }
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

export const getGrantByIdQuery = gql`
  query GetGrantQuery($grantId: ID!) {
    grant(id: $grantId) {
      id
      client
      state
      finalizationReason
      access {
        id
        identifier
        createdAt
        actions
        type
        limits {
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
          interval
        }
      }
      createdAt
    }
  }
`

export const revokeGrantMutation = gql`
  mutation RevokeGrantMutation($grantId: String!) {
    revokeGrant(input: { grantId: $grantId }) {
      id
    }
  }
`
