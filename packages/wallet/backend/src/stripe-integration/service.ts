import { BadRequest } from '@shared/backend'
import { Logger } from 'winston'
import { GateHubClient } from '../gatehub/client'
import { Env } from '../config/env'
import { TransactionTypeEnum } from '../gatehub/consts'
import { StripeWebhookType } from './validation'

export enum EventType {
  payment_intent_canceled = 'payment_intent.canceled',
  payment_intent_payment_failed = 'payment_intent.payment_failed',
  payment_intent_succeeded = 'payment_intent.succeeded'
}

interface IStripeService {
  onWebHook: (wh: StripeWebhookType) => Promise<void>
}

export class StripeService implements IStripeService {
  constructor(
    private env: Env,
    private logger: Logger,
    private gateHubClient: GateHubClient
  ) {}

  public async onWebHook(wh: StripeWebhookType): Promise<void> {
    this.logger.info(`received webhook of type : ${wh.type} for : ${wh.id}`)

    switch (wh.type) {
      case EventType.payment_intent_succeeded:
        await this.handlePaymentIntentSucceeded(wh)
        break
      case EventType.payment_intent_payment_failed:
        await this.handlePaymentIntentFailed(wh)
        break
      case EventType.payment_intent_canceled:
        await this.handlePaymentIntentCanceled(wh)
        break
    }
  }

  private async handlePaymentIntentSucceeded(wh: StripeWebhookType) {
    const paymentIntent = wh.data.object
    const metadata = paymentIntent.metadata
    const receiving_address: string = metadata.receiving_address
    const currency: string = paymentIntent.currency
    const amount: number = paymentIntent.amount

    try {
      await this.gateHubClient.createTransaction({
        amount,
        vault_uuid: this.gateHubClient.getVaultUuid(currency),
        receiving_address,
        sending_address: this.env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
        type: TransactionTypeEnum.HOSTED,
        message: 'Stripe Transfer'
      })
    } catch (error) {
      this.logger.error('Error creating gatehub transaction', { error })
      throw new BadRequest('Failed to create transaction')
    }
  }

  private async handlePaymentIntentFailed(wh: StripeWebhookType) {
    // No need to take action on the GateHub side as no funds were transferred
    const paymentIntent = wh.data.object
    const metadata = paymentIntent.metadata
    const receiving_address = metadata.receiving_address

    this.logger.warn('Payment intent failed', {
      payment_intent_id: paymentIntent.id,
      receiving_address,
      error: paymentIntent.last_payment_error
    })
  }

  private async handlePaymentIntentCanceled(wh: StripeWebhookType) {
    const paymentIntent = wh.data.object
    // No action needed on GateHub side as payment was canceled
    this.logger.info('Payment intent canceled', {
      payment_intent_id: paymentIntent.id,
      receiving_address: paymentIntent.metadata.receiving_address
    })
  }
}
