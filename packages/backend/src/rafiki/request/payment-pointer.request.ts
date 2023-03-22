import { gql } from 'graphql-request'
import env from '../../config/env'
import type {
  CreatePaymentPointerKeyMutationVariables,
  CreatePaymentPointerMutation,
  CreatePaymentPointerMutationVariables, JwkInput
} from '../generated/graphql'
import { graphqlClient } from '../graphqlClient'
import {CreatePaymentPointerKeyMutation} from "../generated/graphql";
import {JWK} from "http-signature-utils";

const createPaymentPointerMutation = gql`
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
  publicName: string,
  assetId: string
) {
  const response = await graphqlClient.request<
    CreatePaymentPointerMutation,
    CreatePaymentPointerMutationVariables
  >(createPaymentPointerMutation, {
    input: {
      assetId,
      publicName,
      url: `${env.OPEN_PAYMENTS_HOST}/${paymentPointerName}`
    }
  })

  if (!response.createPaymentPointer.success) {
    throw new Error(response.createPaymentPointer.message)
  }
  if (!response.createPaymentPointer.paymentPointer) {
    throw new Error('Unable to fetch created payment pointer')
  }

  return response.createPaymentPointer.paymentPointer
}

const createPaymentPointerKeyMutation = gql`
  mutation CreatePaymentPointerKey($input: CreatePaymentPointerKeyInput!) {
    createPaymentPointerKey(input: $input) {
      code
      success
      message
    }
  }
`

export async function createPaymentPointerKey(
  paymentPointerId: string,
  jwk: JWK,
) {
  const response = await graphqlClient.request<
      CreatePaymentPointerKeyMutation,
    CreatePaymentPointerKeyMutationVariables
  >(createPaymentPointerKeyMutation, {
    input: {
      paymentPointerId,
      jwk: jwk as JwkInput,
    }
  })

  if (!response.createPaymentPointerKey.success) {
    throw new Error(response.createPaymentPointerKey.message)
  }

  return response.createPaymentPointerKey;
}
