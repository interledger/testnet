import { gql } from 'graphql-request'
import env from '../../config/env'
import type {
  CreatePaymentPointerMutation,
  CreatePaymentPointerMutationVariables
} from '../generated/graphql'
import { graphqlClient } from '../graphqlClient'

const createPaymentPointeMutation = gql`
  mutation CreatePaymentPointerMutation($input: CreatePaymentPointerInput!) {
    createPaymentPointer(input: $input) {
      code
      success
      message
      paymentPointer {
        id
        url
        publicName
      }
    }
  }
`

export async function createRafikiPaymentPointer(
  paymentPointerName: string,
  publicName: string,
  assetId: string
) {
  const response = await graphqlClient.request<
    CreatePaymentPointerMutation,
    CreatePaymentPointerMutationVariables
  >(createPaymentPointeMutation, {
    input: {
      assetId,
      publicName,
      url: `${env.OPEN_PAYMENTS_HOST}/${paymentPointerName}`
    }
  })

  if (!response.createPaymentPointer.success) {
    throw new Error(response.createPaymentPointer.message)
  }
  if (!response.createPaymentPointer.paymentPointer) {
    throw new Error('Unable to fetch created payment pointer')
  }

  return response.createPaymentPointer.paymentPointer
}
