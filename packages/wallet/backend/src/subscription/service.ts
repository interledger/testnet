import { WalletAddressService } from '@/walletAddress/service'
import { Transaction } from '@/transaction/model'
import { transformAmount, urlToPaymentId } from '@/utils/helpers'
import axios from 'axios'
import { Env } from '@/config/env'
import { Forbidden, NotFound } from '@shared/backend'

export interface SubscriptionProduct {
  id: string
  name: string
  slug: string
  price: number
  productType: 'ONE_TIME' | 'SUBSCRIPTION'
  billingInterval?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
  billingIntervalCount?: number
}

export interface SubscriptionRecord {
  id: string
  walletAddress: string
  quantity?: number
  amount: number
  currency: string
  grantInterval?: string
  currentPeriodNumber?: number
  totalPayments?: number
  status: 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
  nextBillingAt?: string | null
  retryCount: number
  latestOrderId?: string
  createdAt: string
  product: SubscriptionProduct
}

export interface MerchantSubscriptionRecord {
  id: string
  buyerWalletAddress: string
  amount: number
  currency: string
  grantInterval?: string
  status: SubscriptionRecord['status']
  nextBillingAt?: string | null
  createdAt: string
  product: SubscriptionProduct
  merchantWalletAddress: string
  merchantPublicName?: string
  latestPaymentId: string
  latestPaymentStatus: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED'
}

export interface MerchantSubscriptionDetails extends SubscriptionDetails {
  merchantWalletAddress: string
  merchantPublicName?: string
  buyerWalletAddress: string
  latestPaymentId: string
  latestPaymentStatus: MerchantSubscriptionRecord['latestPaymentStatus']
}

export interface MerchantOneTimeOrderRecord {
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

export interface SubscriptionPaymentHistoryItem {
  orderId: string
  paymentNumber?: number
  totalPayments?: number
  paymentId?: string
  orderStatus: string
  paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED'
  amount: number
  createdAt: string
}

export interface SubscriptionDetails {
  subscription: SubscriptionRecord
  paymentHistory: SubscriptionPaymentHistoryItem[]
}

export interface SubscriptionAuthorizationRedirect {
  redirectUrl: string
}

export interface SubscriptionReauthorizationResult {
  status: SubscriptionRecord['status']
  nextBillingAt?: string | null
}

export interface FinishSubscriptionAuthorizationRequest {
  result?: 'grant_rejected' | 'grant_invalid'
  hash?: string
  interactRef?: string
}

interface BoutiqueListResponse {
  success: boolean
  result: BoutiqueSubscriptionRecord[]
}

interface BoutiqueGetResponse {
  success: boolean
  result: SubscriptionDetails
}

interface BoutiqueOrderListResponse {
  success: boolean
  result: BoutiqueOrderRecord[]
}

interface BoutiqueRetryResponse {
  success: boolean
  result?: SubscriptionRecord
}

interface BoutiqueReauthorizeResponse {
  success: boolean
  result?: SubscriptionAuthorizationRedirect
}

interface BoutiqueFinishReauthorizeResponse {
  success: boolean
  result?: SubscriptionReauthorizationResult
}

interface BoutiqueSubscriptionRecord extends SubscriptionRecord {
  latestOrder?: {
    payments?: {
      incomingPaymentUrl: string
    }
  }
}

interface BoutiqueOrderRecord {
  id: string
  subscriptionId?: string
  total: number
  createdAt: string
  status: string
  payments?: {
    incomingPaymentUrl: string
    walletAddress: string
    status: 'PENDING' | 'COMPLETED' | 'FAILED'
  }
  orderItems: Array<{
    quantity: number
    product: SubscriptionProduct
  }>
}

type MerchantTransactionMatch = Transaction & {
  walletAddressUrl?: string
  walletAddressPublicName?: string
  assetScale: number
}

export interface ISubscriptionService {
  list: (userId: string) => Promise<SubscriptionRecord[]>
  listForMerchant: (userId: string) => Promise<MerchantSubscriptionRecord[]>
  listOneTimeOrdersForMerchant: (
    userId: string
  ) => Promise<MerchantOneTimeOrderRecord[]>
  getByIdForMerchant: (
    userId: string,
    id: string
  ) => Promise<MerchantSubscriptionDetails>
  getById: (userId: string, id: string) => Promise<SubscriptionDetails>
  retry: (userId: string, id: string) => Promise<SubscriptionRecord>
  startReauthorization: (
    userId: string,
    id: string
  ) => Promise<SubscriptionAuthorizationRedirect>
  finishReauthorization: (
    userId: string,
    id: string,
    payload: FinishSubscriptionAuthorizationRequest
  ) => Promise<SubscriptionReauthorizationResult>
}

export class SubscriptionService implements ISubscriptionService {
  constructor(
    private env: Env,
    private walletAddressService: WalletAddressService
  ) {}

  async list(userId: string): Promise<SubscriptionRecord[]> {
    const identifiers = await this.walletAddressService.listIdentifiersByUserId(
      userId
    )

    if (identifiers.length === 0) {
      return []
    }

    const responses = await Promise.allSettled(
      identifiers.map(async (walletAddress) => {
        const response = await axios.get<BoutiqueListResponse>(
          `${this.env.BOUTIQUE_BACKEND_URL}/subscriptions`,
          {
            params: {
              walletAddress
            }
          }
        )

        if (!response.data.success) {
          return []
        }

        return response.data.result
      })
    )

    const mapById = new Map<string, SubscriptionRecord>()

    for (const result of responses) {
      if (result.status === 'fulfilled') {
        for (const subscription of result.value) {
          mapById.set(subscription.id, subscription)
        }
      }
    }

    return Array.from(mapById.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  async listForMerchant(userId: string): Promise<MerchantSubscriptionRecord[]> {
    const subscriptions = await this.getBoutiqueSubscriptions()
    const paymentIds = this.getIncomingPaymentIds(subscriptions)

    if (paymentIds.length === 0) {
      return []
    }

    const transactions = await this.getMerchantTransactions(userId, paymentIds)

    const transactionByPaymentId = new Map<string, MerchantTransactionMatch>()

    for (const transaction of transactions) {
      transactionByPaymentId.set(transaction.paymentId, transaction)
    }

    return subscriptions
      .flatMap((subscription) => {
        const incomingPaymentUrl = subscription.latestOrder?.payments?.incomingPaymentUrl

        if (!incomingPaymentUrl) {
          return []
        }

        const paymentId = urlToPaymentId(incomingPaymentUrl)
        const transaction = transactionByPaymentId.get(paymentId)

        if (!transaction?.walletAddressUrl || transaction.value === null) {
          return []
        }

        return [
          {
            id: subscription.id,
            buyerWalletAddress: subscription.walletAddress,
            amount: parseFloat(
              transformAmount(transaction.value, transaction.assetScale)
            ),
            currency: transaction.assetCode,
            grantInterval: subscription.grantInterval,
            status: subscription.status,
            nextBillingAt: subscription.nextBillingAt,
            createdAt: subscription.createdAt,
            product: subscription.product,
            merchantWalletAddress: transaction.walletAddressUrl,
            merchantPublicName: transaction.walletAddressPublicName,
            latestPaymentId: transaction.paymentId,
            latestPaymentStatus: transaction.status
          }
        ]
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }

  async listOneTimeOrdersForMerchant(
    userId: string
  ): Promise<MerchantOneTimeOrderRecord[]> {
    const orders = await this.getBoutiqueStandaloneOrders()
    const paymentIds = this.getIncomingPaymentIdsFromOrders(orders)

    if (paymentIds.length === 0) {
      return []
    }

    const transactions = await this.getMerchantTransactions(userId, paymentIds)
    const transactionByPaymentId = new Map<string, MerchantTransactionMatch>()

    for (const transaction of transactions) {
      transactionByPaymentId.set(transaction.paymentId, transaction)
    }

    return orders
      .flatMap((order) => {
        const incomingPaymentUrl = order.payments?.incomingPaymentUrl

        if (
          !incomingPaymentUrl ||
          !order.payments?.walletAddress ||
          order.orderItems.length === 0 ||
          order.orderItems.some(
            (orderItem) => orderItem.product.productType !== 'ONE_TIME'
          )
        ) {
          return []
        }

        const paymentId = urlToPaymentId(incomingPaymentUrl)
        const transaction = transactionByPaymentId.get(paymentId)

        if (!transaction?.walletAddressUrl || transaction.value === null) {
          return []
        }

        return [
          {
            id: order.id,
            buyerWalletAddress: order.payments.walletAddress,
            amount: parseFloat(
              transformAmount(transaction.value, transaction.assetScale)
            ),
            currency: transaction.assetCode,
            createdAt: order.createdAt,
            orderStatus: order.status,
            paymentStatus: order.payments.status,
            merchantWalletAddress: transaction.walletAddressUrl,
            merchantPublicName: transaction.walletAddressPublicName,
            latestPaymentId: transaction.paymentId,
            productNames: order.orderItems.map((orderItem) => orderItem.product.name)
          }
        ]
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }

  async getByIdForMerchant(
    userId: string,
    id: string
  ): Promise<MerchantSubscriptionDetails> {
    const subscriptions = await this.getBoutiqueSubscriptions()
    const subscription = subscriptions.find((item) => item.id === id)

    if (!subscription) {
      throw new NotFound('Subscription not found.')
    }

    const incomingPaymentUrl = subscription.latestOrder?.payments?.incomingPaymentUrl

    if (!incomingPaymentUrl) {
      throw new Forbidden('You cannot access this subscription')
    }

    const paymentId = urlToPaymentId(incomingPaymentUrl)
    const [transaction] = await this.getMerchantTransactions(userId, [paymentId])

    if (!transaction?.walletAddressUrl) {
      throw new Forbidden('You cannot access this subscription')
    }

    const details = await this.getBoutiqueSubscriptionDetails(id)

    return {
      ...details,
      buyerWalletAddress: subscription.walletAddress,
      merchantWalletAddress: transaction.walletAddressUrl,
      merchantPublicName: transaction.walletAddressPublicName,
      latestPaymentId: transaction.paymentId,
      latestPaymentStatus: transaction.status
    }
  }

  async getById(userId: string, id: string): Promise<SubscriptionDetails> {
    const details = await this.getBoutiqueSubscriptionDetails(id)

    const belongsToUser = await this.walletAddressService.belongsToUser(
      userId,
      details.subscription.walletAddress
    )

    if (!belongsToUser) {
      throw new Forbidden('You cannot access this subscription')
    }

    return details
  }

  async retry(userId: string, id: string): Promise<SubscriptionRecord> {
    const details = await this.getById(userId, id)

    const response = await axios
      .post<BoutiqueRetryResponse>(
        `${this.env.BOUTIQUE_BACKEND_URL}/subscriptions/${id}/retry`
      )
      .catch(() => {
        throw new NotFound('Subscription not found.')
      })

    if (!response.data.success || !response.data.result) {
      throw new NotFound('Subscription not found.')
    }

    if (details.subscription.walletAddress !== response.data.result.walletAddress) {
      throw new Forbidden('You cannot retry this subscription')
    }

    return response.data.result
  }

  async startReauthorization(
    userId: string,
    id: string
  ): Promise<SubscriptionAuthorizationRedirect> {
    await this.getById(userId, id)

    const response = await axios
      .post<BoutiqueReauthorizeResponse>(
        `${this.env.BOUTIQUE_BACKEND_URL}/subscriptions/${id}/reauthorize`
      )
      .catch(() => {
        throw new NotFound('Subscription not found.')
      })

    if (!response.data.success || !response.data.result) {
      throw new NotFound('Subscription not found.')
    }

    return response.data.result
  }

  async finishReauthorization(
    userId: string,
    id: string,
    payload: FinishSubscriptionAuthorizationRequest
  ): Promise<SubscriptionReauthorizationResult> {
    await this.getById(userId, id)

    const response = await axios
      .patch<BoutiqueFinishReauthorizeResponse>(
        `${this.env.BOUTIQUE_BACKEND_URL}/subscriptions/${id}/reauthorize`,
        payload
      )
      .catch(() => {
        throw new NotFound('Subscription not found.')
      })

    if (!response.data.success || !response.data.result) {
      throw new NotFound('Subscription not found.')
    }

    return response.data.result
  }

  private async getBoutiqueSubscriptions(): Promise<BoutiqueSubscriptionRecord[]> {
    const response = await axios
      .get<BoutiqueListResponse>(`${this.env.BOUTIQUE_BACKEND_URL}/subscriptions`)
      .catch(() => {
        throw new NotFound('Subscription not found.')
      })

    if (!response.data.success) {
      return []
    }

    return response.data.result
  }

  private async getBoutiqueSubscriptionDetails(
    id: string
  ): Promise<SubscriptionDetails> {
    const response = await axios
      .get<BoutiqueGetResponse>(`${this.env.BOUTIQUE_BACKEND_URL}/subscriptions/${id}`)
      .catch(() => {
        throw new NotFound('Subscription not found.')
      })

    if (!response.data.success) {
      throw new NotFound('Subscription not found.')
    }

    return response.data.result
  }

  private async getBoutiqueStandaloneOrders(): Promise<BoutiqueOrderRecord[]> {
    const response = await axios
      .get<BoutiqueOrderListResponse>(`${this.env.BOUTIQUE_BACKEND_URL}/orders`)
      .catch(() => {
        throw new NotFound('Order not found.')
      })

    if (!response.data.success) {
      return []
    }

    return response.data.result.filter((order) => !order.subscriptionId)
  }

  private getIncomingPaymentIds(
    subscriptions: BoutiqueSubscriptionRecord[]
  ): string[] {
    return subscriptions
      .map((subscription) => subscription.latestOrder?.payments?.incomingPaymentUrl)
      .filter((incomingPaymentUrl): incomingPaymentUrl is string =>
        Boolean(incomingPaymentUrl)
      )
      .map((incomingPaymentUrl) => urlToPaymentId(incomingPaymentUrl))
  }

  private getIncomingPaymentIdsFromOrders(orders: BoutiqueOrderRecord[]): string[] {
    return orders
      .map((order) => order.payments?.incomingPaymentUrl)
      .filter((incomingPaymentUrl): incomingPaymentUrl is string =>
        Boolean(incomingPaymentUrl)
      )
      .map((incomingPaymentUrl) => urlToPaymentId(incomingPaymentUrl))
  }

  private async getMerchantTransactions(
    userId: string,
    paymentIds: string[]
  ): Promise<MerchantTransactionMatch[]> {
    return (await Transaction.query()
      .select(
        'transactions.*',
        'walletAddress.url as walletAddressUrl',
        'walletAddress.publicName as walletAddressPublicName',
        'account.assetScale'
      )
      .leftOuterJoinRelated('[walletAddress, account.user]')
      .whereNull('deletedAt')
      .where('account:user.id', userId)
      .where('transactions.type', 'INCOMING')
      .whereIn('transactions.paymentId', paymentIds)) as MerchantTransactionMatch[]
  }
}
