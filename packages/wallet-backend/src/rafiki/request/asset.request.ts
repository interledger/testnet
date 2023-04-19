import type {
  CreateAssetMutation,
  CreateAssetMutationVariables,
  GetAssetQuery,
  GetAssetQueryVariables,
  GetAssetsQuery,
  GetAssetsQueryVariables
} from '../generated/graphql'
import { gql } from 'graphql-request'
import { graphqlClient } from '../graphqlClient'

const createAssetMutation = gql`
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

export async function createAsset(code: string, scale: number) {
  const response = await graphqlClient.request<
    CreateAssetMutation,
    CreateAssetMutationVariables
  >(createAssetMutation, { input: { code, scale } })

  if (!response.createAsset.success || !response.createAsset.asset) {
    throw new Error('Data was empty')
  }

  return response.createAsset.asset
}

const getAssetsQuery = gql`
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

export async function listAssets() {
  const response = await graphqlClient.request<
    GetAssetsQuery,
    GetAssetsQueryVariables
  >(getAssetsQuery, {})

  return response.assets.edges.map((el) => el.node)
}

const getAssetQuery = gql`
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

export async function getAsset(id: string) {
  const response = await graphqlClient.request<
    GetAssetQuery,
    GetAssetQueryVariables
  >(getAssetQuery, { id })

  return response.asset
}
