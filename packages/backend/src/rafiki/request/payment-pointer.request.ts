import {
  CreatePaymentPointerMutationResponse,
  PaymentPointer
} from '../generated/graphql'
import { gql } from 'graphql-request'
import { requestGQL } from '../graphql.client'
import env from '../../config/env'

const OPEN_PAYMENTS_HOST = env.OPEN_PAYMENTS_HOST

export async function createRafikiPaymentPointer(
  paymentPointerName: string,
  publicName: string,
  assetId: string
): Promise<PaymentPointer> {
  const createPaymentPointerQuery = gql`
    mutation CreatePaymentPointer($input: CreatePaymentPointerInput!) {
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
  const createPaymentPointerInput = {
    assetId: assetId,
    url: `${OPEN_PAYMENTS_HOST}/${paymentPointerName}`,
    publicName: publicName
  }

  return requestGQL<{
    createPaymentPointer: CreatePaymentPointerMutationResponse
  }>(createPaymentPointerQuery, { input: createPaymentPointerInput }).then(
    (data) => {
      if (!data.createPaymentPointer.success) {
        throw new Error(data.createPaymentPointer.message)
      }
      if (!data.createPaymentPointer.paymentPointer) {
        throw new Error('Unable to fetch created payment pointer')
      }
      return data.createPaymentPointer.paymentPointer
    }
  )
}
