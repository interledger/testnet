import {request, gql} from 'graphql-request'
import {PaymentPointer} from "open-payments";

const GRAPHQL_ENDPOINT = 'http://backend:3001/graphql'
const OPEN_PAYMENTS_HOST = 'https://backend:80'
export async function requestGQL(query: string, variables: any, headers: any): Promise<any> {
    return request({
        url: GRAPHQL_ENDPOINT,
        document: query,
        variables: variables,
        requestHeaders: headers,
    }).then((data) => console.log(data))
}

export async function createPaymentPointer(
    accountName: string,
    paymentPointerName: string,
    _assetId: string
): Promise<PaymentPointer> {
    const createPaymentPointerQuery= gql`
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
        asset: {
            code: 'USD',
            scale: 1
        },
        url: `${OPEN_PAYMENTS_HOST}/${accountName}/${paymentPointerName}`,
        publicName: paymentPointerName
    }

    return requestGQL(createPaymentPointerQuery, { input: createPaymentPointerInput }, {})
        .then(({ data }) => {
            console.log(data)

            if (
                !data.createPaymentPointer.success ||
                !data.createPaymentPointer.paymentPointer
            ) {
                throw new Error('Data was empty')
            }

            return data.createPaymentPointer.paymentPointer
        })
}
