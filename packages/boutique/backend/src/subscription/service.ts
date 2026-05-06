import { Logger } from 'winston'
import { TransactionOrKnex } from 'objection'
import { NotFound, InternalServerError } from '@shared/backend'
import { Subscription, SubscriptionStatus } from './model'

interface CreateParams {
  productId: string
  quantity?: number
  amount: number
  currency: string
  walletAddress: string
  totalPayments?: number
}

interface PendingGrantParams {
  continueUri: string
  continueToken: string
  interactNonce: string
  clientNonce: string
  grantInterval: string
  walletAddress: string
}

interface ActivateParams {
  accessToken: string
  manageUrl: string
  latestOrderId: string
  nextBillingAt?: Date | null
  currentPeriodNumber?: number
}

export interface ISubscriptionService {
  create: (params: CreateParams, trx?: TransactionOrKnex) => Promise<Subscription>
  delete: (id: string, trx?: TransactionOrKnex) => Promise<Subscription | undefined>
  get: (id: string) => Promise<Subscription>
  list: (walletAddress?: string) => Promise<Subscription[]>
  ensurePendingState: (id: string) => Promise<Subscription>
  setPendingGrantData: (
    id: string,
    params: PendingGrantParams,
    trx?: TransactionOrKnex
  ) => Promise<Subscription>
  activate: (
    id: string,
    params: ActivateParams,
    trx?: TransactionOrKnex
  ) => Promise<Subscription>
  cancel: (id: string, trx?: TransactionOrKnex) => Promise<Subscription>
  markPastDue: (id: string, trx?: TransactionOrKnex) => Promise<Subscription>
}

export class SubscriptionService implements ISubscriptionService {
  constructor(private logger: Logger) {}

  public async create(
    params: CreateParams,
    trx?: TransactionOrKnex
  ): Promise<Subscription> {
    return await Subscription.query(trx).insert(params).returning('*')
  }

  public async delete(
    id: string,
    trx?: TransactionOrKnex
  ): Promise<Subscription | undefined> {
    return await Subscription.query(trx).deleteById(id).returning('*').first()
  }

  public async get(id: string): Promise<Subscription> {
    const subscription = await Subscription.query()
      .findById(id)
      .withGraphFetched('[product, latestOrder]')

    if (!subscription) {
      this.logger.error(`Subscription with ID "${id}" was not found.`)
      throw new NotFound('Subscription was not found.')
    }

    return subscription
  }

  public async list(walletAddress?: string): Promise<Subscription[]> {
    const query = Subscription.query().withGraphFetched(
      '[product, latestOrder.payments]'
    )

    if (walletAddress) {
      query.where('walletAddress', '=', walletAddress)
    }

    return await query.orderBy('createdAt', 'desc')
  }

  public async ensurePendingState(id: string): Promise<Subscription> {
    const subscription = await this.get(id)
    if (subscription.status !== SubscriptionStatus.PENDING) {
      this.logger.error(
        `Trying to finish a non-pending subscription (ID: ${id}).`
      )
      throw new InternalServerError()
    }

    return subscription
  }

  public async setPendingGrantData(
    id: string,
    params: PendingGrantParams,
    trx?: TransactionOrKnex
  ): Promise<Subscription> {
    const subscription = await this.get(id)

    return await subscription.$query(trx).patchAndFetch({
      continueUri: params.continueUri,
      continueToken: params.continueToken,
      interactNonce: params.interactNonce,
      clientNonce: params.clientNonce,
      grantInterval: params.grantInterval,
      walletAddress: params.walletAddress
    })
  }

  public async activate(
    id: string,
    params: ActivateParams,
    trx?: TransactionOrKnex
  ): Promise<Subscription> {
    const subscription = await this.get(id)

    return await subscription.$query(trx).patchAndFetch({
      status: SubscriptionStatus.ACTIVE,
      accessToken: params.accessToken,
      manageUrl: params.manageUrl,
      latestOrderId: params.latestOrderId,
      nextBillingAt: params.nextBillingAt ?? null,
      ...(typeof params.currentPeriodNumber === 'number'
        ? { currentPeriodNumber: params.currentPeriodNumber }
        : {})
    })
  }

  public async cancel(
    id: string,
    trx?: TransactionOrKnex
  ): Promise<Subscription> {
    const subscription = await this.get(id)

    return await subscription.$query(trx).patchAndFetch({
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date()
    })
  }

  public async markPastDue(
    id: string,
    trx?: TransactionOrKnex
  ): Promise<Subscription> {
    const subscription = await this.get(id)

    return await subscription.$query(trx).patchAndFetch({
      status: SubscriptionStatus.PAST_DUE,
      retryCount: subscription.retryCount + 1
    })
  }
}
