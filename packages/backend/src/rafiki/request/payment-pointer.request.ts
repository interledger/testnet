import {
  CreatePaymentPointerMutationResponse,
  PaymentPointer
} from '../generated/graphql'
import { gql } from 'graphql-request'
import { requestGQL } from '../graphql.client'
import env from '../../config/env'

const OPEN_PAYMENTS_HOST = env.OPEN_PAYMENTS_HOST

export async function createRafikiPaymentPointer(
  accountName: string,
  paymentPointerName: string,
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
    url: `${OPEN_PAYMENTS_HOST}/${accountName}/${paymentPointerName}`,
    publicName: paymentPointerName
  }

  return requestGQL<{
    createPaymentPointer: CreatePaymentPointerMutationResponse
  }>(createPaymentPointerQuery, { input: createPaymentPointerInput }).then(
    (data) => {
      if (
        !data.createPaymentPointer.success ||
        !data.createPaymentPointer.paymentPointer
      ) {
        throw new Error('Data was empty')
      }

      return data.createPaymentPointer.paymentPointer
    }
  )
}
