import { gql } from 'graphql-request'

export const createWalletAddressMutation = gql`
  mutation CreateWalletAddressMutation($input: CreateWalletAddressInput!) {
    createWalletAddress(input: $input) {
      walletAddress {
        id
        address
        publicName
      }
    }
  }
`

export const updateWalletAddressMutation = gql`
  mutation UpdateWalletAddressMutation($input: UpdateWalletAddressInput!) {
    updateWalletAddress(input: $input) {
      walletAddress {
        id
        address
        publicName
      }
    }
  }
`
