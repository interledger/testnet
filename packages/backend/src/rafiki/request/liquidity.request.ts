import { gql } from 'graphql-request'
import {
  DepositLiquidityMutation,
  DepositLiquidityMutationVariables,
  WithdrawLiquidityMutation,
  WithdrawLiquidityMutationVariables
} from '../generated/graphql'
import { graphqlClient } from '../graphqlClient'

const withdrawLiquidityMutation = gql`
  mutation WithdrawLiquidityMutation($eventId: String!) {
    withdrawEventLiquidity(eventId: $eventId) {
      code
      success
      message
      error
    }
  }
`

const depositLiquidityMutation = gql`
  mutation DepositLiquidityMutation($eventId: String!) {
    depositEventLiquidity(eventId: $eventId) {
      code
      success
      message
      error
    }
  }
`

export async function withdrawLiqudity(eventId: string) {
  const response = await graphqlClient.request<
    WithdrawLiquidityMutation,
    WithdrawLiquidityMutationVariables
  >(depositLiquidityMutation, {
    eventId
  })

  if (!response.withdrawEventLiquidity?.success) {
    throw new Error(
      response.withdrawEventLiquidity?.message || 'Unable to withdrawLiquidity'
    )
  }

  return true
}

export async function depositLiquidity(eventId: string) {
  const response = await graphqlClient.request<
    DepositLiquidityMutation,
    DepositLiquidityMutationVariables
  >(withdrawLiquidityMutation, {
    eventId
  })

  if (!response.depositEventLiquidity?.success) {
    throw new Error(
      response.depositEventLiquidity?.message || 'Unable to withdrawLiquidity'
    )
  }

  return true
}
