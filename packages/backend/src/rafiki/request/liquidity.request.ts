import { gql } from 'graphql-request'
import {
  DepositLiquidityMutation,
  DepositLiquidityMutationVariables,
  WithdrawLiquidityMutation,
  WithdrawLiquidityMutationVariables
} from '../generated/graphql'
import { graphqlClient } from '../graphqlClient'
import { BadRequestException } from '../../shared/models/errors/BadRequestException'

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
  >(withdrawLiquidityMutation, {
    eventId
  })

  if (!response.withdrawEventLiquidity?.success) {
    throw new BadRequestException(
      response.withdrawEventLiquidity?.message ||
        'Unable to withdrawLiquidity from rafiki'
    )
  }

  return true
}

export async function depositLiquidity(eventId: string) {
  const response = await graphqlClient.request<
    DepositLiquidityMutation,
    DepositLiquidityMutationVariables
  >(depositLiquidityMutation, {
    eventId
  })

  if (!response.depositEventLiquidity?.success) {
    throw new BadRequestException(
      response.depositEventLiquidity?.message || 'Unable to deposit to rafiki'
    )
  }

  return true
}
