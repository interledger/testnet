import { BadRequest } from '@shared/backend'
import { Logger } from 'winston'
import { GateHubClient } from '../gatehub/client'
import { Env } from '../config/env'
import { TransactionTypeEnum } from '../gatehub/consts'
import { StripeWebhookType } from './validation'
import { WalletAddressService } from '../walletAddress/service'
import { AccountService } from '../account/service'
import { Transaction } from '../transaction/model'
import { transformBalance, applyScale } from '../utils/helpers'

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
    private gateHubClient: GateHubClient,
    private walletAddressService: WalletAddressService,
    private accountService: AccountService
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

    const scaledAmount = applyScale(paymentIntent.amount, 2)

    try {
      const walletAddress =
        await this.walletAddressService.getByUrl(receiving_address)

      if (!walletAddress) {
        throw new BadRequest('Wallet address not found')
      }

      const { gateHubWalletId } =
        await this.accountService.getGateHubWalletAddress(walletAddress)

      await this.gateHubClient.createTransaction({
        amount: scaledAmount,
        vault_uuid: this.gateHubClient.getVaultUuid(currency.toUpperCase()),
        receiving_address: gateHubWalletId,
        sending_address: this.env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
        type: TransactionTypeEnum.HOSTED,
        message: 'Stripe Transfer'
      })

      await Transaction.query().insert({
        walletAddressId: walletAddress.id,
        accountId: walletAddress.accountId,
        paymentId: paymentIntent.id,
        assetCode: currency.toUpperCase(),
        value: transformBalance(scaledAmount, 2),
        type: 'INCOMING',
        status: 'COMPLETED',
        description: 'Stripe Payment',
        source: 'Stripe'
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
