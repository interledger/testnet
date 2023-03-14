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
  assetId: string
) {
  const response = await graphqlClient.request<
    CreatePaymentPointerMutation,
    CreatePaymentPointerMutationVariables
  >(createPaymentPointeMutation, {
    input: {
      assetId,
      publicName: paymentPointerName,
      url: `${env.OPEN_PAYMENTS_HOST}/${paymentPointerName}`
    }
  })

  if (
    !response.createPaymentPointer.success ||
    !response.createPaymentPointer.paymentPointer
  ) {
    throw new Error('Data was empty')
  }

  return response.createPaymentPointer.paymentPointer
}
