import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'

export type SubscriptionProduct = {
  id: string
  name: string
  slug: string
  price: number
  productType: 'ONE_TIME' | 'SUBSCRIPTION'
  billingInterval?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
  billingIntervalCount?: number
}

export type SubscriptionRecord = {
  id: string
  walletAddress: string
  quantity?: number
  amount: number
  currency: string
  grantInterval?: string
  currentPeriodNumber?: number
  totalPayments?: number
  status: SubscriptionStatus
  nextBillingAt?: string | null
  retryCount: number
  latestOrderId?: string
  createdAt: string
  product: SubscriptionProduct
}

export type MerchantSubscriptionRecord = {
  id: string
  buyerWalletAddress: string
  amount: number
  currency: string
  grantInterval?: string
  status: SubscriptionStatus
  nextBillingAt?: string | null
  createdAt: string
  product: SubscriptionProduct
  merchantWalletAddress: string
  merchantPublicName?: string
  latestPaymentId: string
  latestPaymentStatus: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED'
}

export type MerchantSubscriptionDetails = SubscriptionDetails & {
  merchantWalletAddress: string
  merchantPublicName?: string
  buyerWalletAddress: string
  latestPaymentId: string
  latestPaymentStatus: MerchantSubscriptionRecord['latestPaymentStatus']
}

export type MerchantOneTimeOrderRecord = {
  id: string
  buyerWalletAddress: string
  amount: number
  currency: string
  createdAt: string
  orderStatus: string
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED'
  merchantWalletAddress: string
  merchantPublicName?: string
  latestPaymentId: string
  productNames: string[]
}

export type SubscriptionPaymentHistoryItem = {
  orderId: string
  paymentNumber?: number
  totalPayments?: number
  paymentId?: string
  orderStatus: string
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED'
  amount: number
  createdAt: string
}

export type SubscriptionDetails = {
  subscription: SubscriptionRecord
  paymentHistory: SubscriptionPaymentHistoryItem[]
}

export type SubscriptionAuthorizationRedirect = {
  redirectUrl: string
}

export type SubscriptionReauthorizationResult = {
  status: SubscriptionStatus
  nextBillingAt?: string | null
}

export type FinishSubscriptionAuthorizationRequest = {
  result?: 'grant_rejected' | 'grant_invalid'
  hash?: string
  interactRef?: string
}

type ListSubscriptionsResult = SuccessResponse<SubscriptionRecord[]>
type ListSubscriptionsResponse = ListSubscriptionsResult | ErrorResponse

type ListMerchantSubscriptionsResult = SuccessResponse<
  MerchantSubscriptionRecord[]
>
type ListMerchantSubscriptionsResponse =
  | ListMerchantSubscriptionsResult
  | ErrorResponse

type ListMerchantOneTimeOrdersResult = SuccessResponse<MerchantOneTimeOrderRecord[]>
type ListMerchantOneTimeOrdersResponse =
  | ListMerchantOneTimeOrdersResult
  | ErrorResponse

type GetSubscriptionResult = SuccessResponse<SubscriptionDetails>
type GetSubscriptionResponse = GetSubscriptionResult | ErrorResponse

type GetMerchantSubscriptionResult = SuccessResponse<MerchantSubscriptionDetails>
type GetMerchantSubscriptionResponse = GetMerchantSubscriptionResult | ErrorResponse

interface SubscriptionService {
  list: (cookies?: string) => Promise<ListSubscriptionsResponse>
  listMerchant: (cookies?: string) => Promise<ListMerchantSubscriptionsResponse>
  listMerchantOneTimeOrders: (
    cookies?: string
  ) => Promise<ListMerchantOneTimeOrdersResponse>
  getMerchantById: (
    subscriptionId: string,
    cookies?: string
  ) => Promise<GetMerchantSubscriptionResponse>
  getById: (subscriptionId: string, cookies?: string) => Promise<GetSubscriptionResponse>
  retry: (subscriptionId: string) => Promise<SuccessResponse<SubscriptionRecord> | ErrorResponse>
  reauthorize: (
    subscriptionId: string
  ) => Promise<SuccessResponse<SubscriptionAuthorizationRedirect> | ErrorResponse>
  finishReauthorization: (
    subscriptionId: string,
    payload: FinishSubscriptionAuthorizationRequest
  ) => Promise<SuccessResponse<SubscriptionReauthorizationResult> | ErrorResponse>
}

const createSubscriptionService = (): SubscriptionService => ({
  async list(cookies) {
    try {
      const response = await httpClient
        .get('subscriptions', {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<ListSubscriptionsResult>()
      return response
    } catch (error) {
      return getError(error, 'Unable to fetch subscriptions list.')
    }
  },

  async listMerchant(cookies) {
    try {
      const response = await httpClient
        .get('subscriptions/merchant', {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<ListMerchantSubscriptionsResult>()

      return response
    } catch (error) {
      return getError(error, 'Unable to fetch merchant subscriptions list.')
    }
  },

  async listMerchantOneTimeOrders(cookies) {
    try {
      const response = await httpClient
        .get('subscriptions/merchant/orders', {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<ListMerchantOneTimeOrdersResult>()

      return response
    } catch (error) {
      return getError(error, 'Unable to fetch merchant one-time orders list.')
    }
  },

  async getById(subscriptionId, cookies) {
    try {
      const response = await httpClient
        .get(`subscriptions/${subscriptionId}`, {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<GetSubscriptionResult>()
      return response
    } catch (error) {
      return getError(error, 'Unable to fetch subscription details.')
    }
  },

  async getMerchantById(subscriptionId, cookies) {
    try {
      const response = await httpClient
        .get(`subscriptions/merchant/${subscriptionId}`, {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<GetMerchantSubscriptionResult>()
      return response
    } catch (error) {
      return getError(error, 'Unable to fetch merchant subscription details.')
    }
  },

  async retry(subscriptionId) {
    try {
      const response = await httpClient
        .post(`subscriptions/${subscriptionId}/retry`)
        .json<SuccessResponse<SubscriptionRecord>>()
      return response
    } catch (error) {
      return getError(error, 'Unable to retry subscription payment.')
    }
  },

  async reauthorize(subscriptionId) {
    try {
      const response = await httpClient
        .post(`subscriptions/${subscriptionId}/reauthorize`)
        .json<SuccessResponse<SubscriptionAuthorizationRedirect>>()

      return response
    } catch (error) {
      return getError(error, 'Unable to start subscription re-authorization.')
    }
  },

  async finishReauthorization(subscriptionId, payload) {
    try {
      const response = await httpClient
        .patch(`subscriptions/${subscriptionId}/reauthorize`, {
          json: payload
        })
        .json<SuccessResponse<SubscriptionReauthorizationResult>>()

      return response
    } catch (error) {
      return getError(error, 'Unable to finish subscription re-authorization.')
    }
  }
})

export const subscriptionService = createSubscriptionService()
