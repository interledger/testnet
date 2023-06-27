import { gql } from 'graphql-request'

export const getGrantsQuery = gql`
  query GetGrantsQuery(
    $after: String
    $before: String
    $first: Int
    $last: Int
    $filter: GrantFilter
  ) {
    grants(
      after: $after
      before: $before
      first: $first
      last: $last
      filter: $filter
    ) {
      edges {
        cursor
        node {
          id
          client
          state
          access {
            id
            identifier
            createdAt
            actions
            type
            limits {
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
      access {
        id
        identifier
        createdAt
        actions
        type
        limits {
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
      code
      success
      message
    }
  }
`
