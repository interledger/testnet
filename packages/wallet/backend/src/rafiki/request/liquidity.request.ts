import { gql } from 'graphql-request'

export const withdrawLiquidityMutation = gql`
  mutation WithdrawLiquidityMutation($eventId: String!) {
    withdrawEventLiquidity(eventId: $eventId) {
      code
      success
      message
      error
    }
  }
`

export const depositLiquidityMutation = gql`
  mutation DepositLiquidityMutation($eventId: String!) {
    depositEventLiquidity(eventId: $eventId) {
      code
      success
      message
      error
    }
  }
`
