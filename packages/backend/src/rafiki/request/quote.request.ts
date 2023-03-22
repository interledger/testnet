import {
  Asset,
  CreateQuoteInput,
  CreateQuoteMutation,
  CreateQuoteMutationVariables,
  Quote
} from '../generated/graphql'
import { gql } from 'graphql-request'
import { graphqlClient } from '../graphqlClient'

const createIncomingPaymentMutation = gql`
  mutation CreateQuoteMutation($input: CreateQuoteInput!) {
    createQuote(input: $input) {
      code
      message
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
    }
  }
`

export async function createQuote(
  paymentPointerId: string,
  receiver: string,
  amount: number,
  asset: Asset
): Promise<Quote> {
  const input: CreateQuoteInput = {
    sendAmount: {
      value: amount as unknown as bigint,
      assetCode: asset.code,
      assetScale: asset.scale
    },
    paymentPointerId,
    receiver
  }
  const { createQuote } = await graphqlClient.request<
    CreateQuoteMutation,
    CreateQuoteMutationVariables
  >(createIncomingPaymentMutation, {
    input
  })

  if (!createQuote.quote) {
    throw new Error('Unable to fetch created quote')
  }

  return createQuote.quote
}
