import { gql } from 'graphql-request'

export const withdrawLiquidityMutation = gql`
  mutation WithdrawLiquidityMutation(
    $eventId: String!
    $idempotencyKey: String!
  ) {
    withdrawEventLiquidity(
      input: { eventId: $eventId, idempotencyKey: $idempotencyKey }
    ) {
      code
      success
      message
      error
    }
  }
`

export const depositLiquidityMutation = gql`
  mutation DepositLiquidityMutation(
    $eventId: String!
    $idempotencyKey: String!
  ) {
    depositEventLiquidity(
      input: { eventId: $eventId, idempotencyKey: $idempotencyKey }
    ) {
      code
      success
      message
      error
    }
  }
`
