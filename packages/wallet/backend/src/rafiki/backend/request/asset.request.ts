import { gql } from 'graphql-request'

export const createAssetMutation = gql`
  mutation CreateAssetMutation($input: CreateAssetInput!) {
    createAsset(input: $input) {
      code
      success
      message
      asset {
        id
        code
        scale
      }
    }
  }
`

export const getAssetsQuery = gql`
  query GetAssetsQuery(
    $after: String
    $before: String
    $first: Int
    $last: Int
  ) {
    assets(after: $after, before: $before, first: $first, last: $last) {
      edges {
        cursor
        node {
          code
          createdAt
          id
          scale
          withdrawalThreshold
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

export const getAssetQuery = gql`
  query GetAssetQuery($id: String!) {
    asset(id: $id) {
      code
      createdAt
      id
      scale
      withdrawalThreshold
    }
  }
`
