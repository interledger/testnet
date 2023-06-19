import { gql } from 'graphql-request'

export const getGrantsQuery = gql`
  query GetGrantsQuery(
    $after: String
    $before: String
    $first: Int
    $last: Int
  ) {
    grants(
      input: { after: $after, before: $before, first: $first, last: $last }
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
  query GetGrantQuery($grantId: String!) {
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
