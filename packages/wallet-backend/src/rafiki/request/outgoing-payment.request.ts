import {
  CreateOutgoingPaymentInput,
  CreateOutgoingPaymentMutation,
  CreateOutgoingPaymentMutationVariables,
  OutgoingPayment
} from '../generated/graphql'
import { gql } from 'graphql-request'
import { graphqlClient } from '../graphqlClient'

const createOutgoingPaymentMutation = gql`
  mutation CreateOutgoingPaymentMutation($input: CreateOutgoingPaymentInput!) {
    createOutgoingPayment(input: $input) {
      code
      message
      payment {
        createdAt
        description
        error
        externalRef
        id
        paymentPointerId
        quote {
          createdAt
          expiresAt
          highEstimatedExchangeRate
          id
          lowEstimatedExchangeRate
          maxPacketAmount
          minExchangeRate
          paymentPointerId
          receiveAmount {
            assetCode
            assetScale
            value
          }
          receiver
          sendAmount {
            assetCode
            assetScale
            value
          }
        }
        receiveAmount {
          assetCode
          assetScale
          value
        }
        receiver
        sendAmount {
          assetCode
          assetScale
          value
        }
        sentAmount {
          assetCode
          assetScale
          value
        }
        state
        stateAttempts
      }
      success
    }
  }
`

export async function createOutgoingPayment(
  paymentPointerId: string,
  quoteId: string,
  description?: string
): Promise<OutgoingPayment> {
  const input: CreateOutgoingPaymentInput = {
    paymentPointerId,
    quoteId,
    description
  }
  const { createOutgoingPayment: paymentResponse } =
    await graphqlClient.request<
      CreateOutgoingPaymentMutation,
      CreateOutgoingPaymentMutationVariables
    >(createOutgoingPaymentMutation, {
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
