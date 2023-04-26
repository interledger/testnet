import {
  Asset,
  CreateIncomingPaymentInput,
  CreateIncomingPaymentMutation,
  CreateIncomingPaymentMutationVariables,
  IncomingPayment
} from '../generated/graphql'
import { gql } from 'graphql-request'
import { graphqlClient } from '../graphqlClient'

const createIncomingPaymentMutation = gql`
  mutation CreateIncomingPaymentMutation($input: CreateIncomingPaymentInput!) {
    createIncomingPayment(input: $input) {
      code
      message
      payment {
        createdAt
        description
        expiresAt
        externalRef
        id
        incomingAmount {
          assetCode
          assetScale
          value
        }
        paymentPointerId
        receivedAmount {
          assetCode
          assetScale
          value
        }
        state
      }
      success
    }
  }
`

export async function createIncomingPayment(
  paymentPointerId: string,
  amount: bigint | null,
  asset: Asset,
  description?: string,
  expiresAt?: string
): Promise<IncomingPayment> {
  const input: CreateIncomingPaymentInput = {
    paymentPointerId,
    description,
    expiresAt,
    ...(amount && {
      incomingAmount: {
        value: amount as unknown as bigint,
        assetCode: asset.code,
        assetScale: asset.scale
      }
    })
  }
  const { createIncomingPayment: paymentResponse } =
    await graphqlClient.request<
      CreateIncomingPaymentMutation,
      CreateIncomingPaymentMutationVariables
    >(createIncomingPaymentMutation, {
      input
    })

  if (!paymentResponse.success) {
    throw new Error(paymentResponse.message ?? 'Empty result')
  }
  if (!paymentResponse.payment) {
    throw new Error('Unable to fetch created payment pointer')
  }

  return paymentResponse.payment
}
