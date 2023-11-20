import { gql } from 'graphql-request'

export const createWalletAddressMutation = gql`
  mutation CreateWalletAddressMutation($input: CreateWalletAddressInput!) {
    createWalletAddress(input: $input) {
      code
      success
      message
      walletAddress {
        id
        url
        publicName
      }
    }
  }
`

export const updateWalletAddressMutation = gql`
  mutation UpdateWalletAddressMutation($input: UpdateWalletAddressInput!) {
    updateWalletAddress(input: $input) {
      code
      success
      message
    }
  }
`
