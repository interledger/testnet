import {
  Asset,
  AssetEdge,
  AssetMutationResponse,
  AssetsConnection
} from '../generated/graphql'
import { gql } from 'graphql-request'
import { requestGQL } from '../graphql.client'

export async function createAsset(code: string, scale: number): Promise<Asset> {
  const createAssetMutation = gql`
    mutation CreateAsset($input: CreateAssetInput!) {
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
  const createAssetInput = {
    input: {
      code,
      scale
    }
  }

  return requestGQL<{ createAsset: AssetMutationResponse }>(
    createAssetMutation,
    createAssetInput
  ).then(({ createAsset }) => {
    if (!createAsset.success || !createAsset.asset) {
      throw new Error('Data was empty')
    }

    return createAsset.asset
  })
}

export async function listAssets(): Promise<Asset[]> {
  const getAssetsQuery = gql`
    query GetAssets($after: String, $before: String, $first: Int, $last: Int) {
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

  return requestGQL<{ assets: AssetsConnection }>(getAssetsQuery).then(
    (data) => {
      return data.assets.edges.map((el: AssetEdge) => el.node)
    }
  )
}

export async function getAsset(id: string): Promise<Asset> {
  const getAssetsQuery = gql`
    query GetAsset($id: String!) {
      asset(id: $id) {
        code
        createdAt
        id
        scale
        withdrawalThreshold
      }
    }
  `

  return requestGQL<{ asset: Asset }>(getAssetsQuery, { id }).then((data) => {
    return data.asset
  })
}
