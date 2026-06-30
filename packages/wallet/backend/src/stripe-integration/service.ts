import { BadRequest } from '@shared/backend'
import { Logger } from 'winston'
import { GateHubClient } from '../gatehub/client'
import { Env } from '../config/env'
import { TransactionTypeEnum } from '../gatehub/consts'
import {
  ChargeRefundedWebhook,
  PaymentIntentCanceledWebhook,
  PaymentIntentFailedWebhook,
  PaymentIntentSucceededWebhook,
  RefundCreatedWebhook,
  RefundFailedWebhook,
  RefundUpdatedWebhook,
  StripeRefundObject,
  StripeWebhookType
} from './validation'
import { WalletAddressService } from '../walletAddress/service'
import { AccountService } from '../account/service'
import { Transaction } from '../transaction/model'
import { transformBalance, applyScale } from '../utils/helpers'
import { Account } from '../account/model'
import { UniqueViolationError } from 'objection'

interface RefundValidationResult {
  refund: StripeRefundObject
  paymentIntentId: string
  originalTx: Transaction
  account: Account
  scaledAmount: number
  refundValue: bigint
  currency: string
  description: string
}

interface RefundGateHubWalletDetails {
  gateHubWalletId: string
  gateHubUserId: string
}

export enum EventType {
  payment_intent_canceled = 'payment_intent.canceled',
  payment_intent_payment_failed = 'payment_intent.payment_failed',
  payment_intent_succeeded = 'payment_intent.succeeded',
  refund_created = 'refund.created',
  refund_updated = 'refund.updated',
  refund_failed = 'refund.failed',
  charge_refunded = 'charge.refunded'
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
        this.handlePaymentIntentFailed(wh)
        break
      case EventType.payment_intent_canceled:
        this.handlePaymentIntentCanceled(wh)
        break
      case EventType.refund_created:
        await this.handleRefundCreated(wh)
        break
      case EventType.refund_updated:
        await this.handleRefundUpdated(wh)
        break
      case EventType.refund_failed:
        this.handleRefundFailed(wh)
        break
      case EventType.charge_refunded:
        this.handleChargeRefunded(wh)
        break
    }
  }

  private refundDescription(paymentIntentId: string): string {
    return `Stripe Refund (${paymentIntentId})`
  }

  private logRefundAlreadyProcessed(refundId: string): void {
    this.logger.info('Refund already processed', {
      refund_id: refundId
    })
  }

  private async handlePaymentIntentSucceeded(
    wh: PaymentIntentSucceededWebhook
  ) {
    const paymentIntent = wh.data.object
    const metadata = paymentIntent.metadata
    const receiving_address: string = metadata.receiving_address
    const currency: string = paymentIntent.currency

    const scaledAmount = applyScale(paymentIntent.amount)

    try {
      const walletAddress =
        await this.walletAddressService.getByUrl(receiving_address)

      if (!walletAddress) {
        this.logger.error('Wallet address not found for payment intent', {
          payment_intent_id: paymentIntent.id,
          receiving_address
        })
        throw new BadRequest('Failed to create transaction')
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
      this.logger.error('Error creating gatehub transaction', {
        payment_intent_id: paymentIntent.id,
        receiving_address,
        error
      })
      throw new BadRequest('Failed to create transaction')
    }
  }

  private handlePaymentIntentFailed(wh: PaymentIntentFailedWebhook) {
    const paymentIntent = wh.data.object
    const metadata = paymentIntent.metadata
    const receiving_address = metadata.receiving_address

    this.logger.warn('Payment intent failed', {
      payment_intent_id: paymentIntent.id,
      receiving_address,
      error: paymentIntent.last_payment_error
    })
  }

  private handlePaymentIntentCanceled(wh: PaymentIntentCanceledWebhook) {
    const paymentIntent = wh.data.object
    this.logger.info('Payment intent canceled', {
      payment_intent_id: paymentIntent.id,
      receiving_address: paymentIntent.metadata.receiving_address
    })
  }

  private async handleRefundCreated(wh: RefundCreatedWebhook) {
    const refund = wh.data.object
    this.logger.info('Refund created', {
      refund_id: refund.id,
      payment_intent_id: refund.payment_intent,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status
    })

    if (refund.status === 'succeeded') {
      await this.processSucceededRefund(refund)
    }
  }

  private handleRefundFailed(wh: RefundFailedWebhook) {
    const refund = wh.data.object
    this.logger.warn('Refund failed', {
      refund_id: refund.id,
      payment_intent_id: refund.payment_intent,
      amount: refund.amount,
      currency: refund.currency,
      failure_reason: refund.failure_reason
    })
  }

  private handleChargeRefunded(wh: ChargeRefundedWebhook) {
    const charge = wh.data.object
    this.logger.info('Charge refunded', {
      charge_id: charge.id,
      payment_intent_id: charge.payment_intent,
      amount_refunded: charge.amount_refunded,
      refunded: charge.refunded
    })
  }

  private async handleRefundUpdated(wh: RefundUpdatedWebhook) {
    const refund = wh.data.object

    if (refund.status !== 'succeeded') {
      this.logger.info('Refund updated', {
        refund_id: refund.id,
        payment_intent_id: refund.payment_intent,
        status: refund.status
      })
      return
    }

    await this.processSucceededRefund(refund)
  }

  private async processSucceededRefund(refund: StripeRefundObject) {
    if (await this.isRefundAlreadyProcessed(refund.id)) {
      return
    }

    const validated = await this.validateRefund(refund)
    if (!validated) {
      return
    }

    const gateHubWallet = await this.getRefundGateHubWallet(validated)
    if (!gateHubWallet) {
      return
    }

    if (!(await this.hasSufficientBalanceForRefund(validated))) {
      return
    }

    await this.reverseAndRecordRefund(validated, gateHubWallet)
  }

  private async isRefundAlreadyProcessed(refundId: string): Promise<boolean> {
    const existingRefund = await Transaction.query().findOne({
      paymentId: refundId,
      source: 'Stripe'
    })

    if (existingRefund) {
      this.logRefundAlreadyProcessed(refundId)
      return true
    }

    return false
  }

  private async validateRefund(
    refund: StripeRefundObject
  ): Promise<RefundValidationResult | undefined> {
    const paymentIntentId = refund.payment_intent
    const originalTx = await Transaction.query().findOne({
      paymentId: paymentIntentId,
      source: 'Stripe',
      type: 'INCOMING'
    })

    if (!originalTx) {
      this.logger.error('Original Stripe payment not found', {
        refund_id: refund.id,
        payment_intent_id: paymentIntentId
      })
      return
    }

    const scaledAmount = applyScale(refund.amount)
    const refundValue = transformBalance(scaledAmount, 2)
    const currency = refund.currency.toUpperCase()

    if (currency !== originalTx.assetCode) {
      this.logger.error('Refund currency does not match original payment', {
        refund_id: refund.id,
        payment_intent_id: paymentIntentId,
        refund_currency: currency,
        original_currency: originalTx.assetCode
      })
      return
    }

    if (!originalTx.walletAddressId) {
      this.logger.error('Original payment has no wallet address', {
        refund_id: refund.id,
        payment_intent_id: paymentIntentId,
        original_transaction_id: originalTx.id
      })
      return
    }

    const account = await Account.query().findById(originalTx.accountId)
    if (!account) {
      this.logger.error('Account not found for original payment', {
        refund_id: refund.id,
        payment_intent_id: paymentIntentId,
        account_id: originalTx.accountId
      })
      return
    }

    return {
      refund,
      paymentIntentId,
      originalTx,
      account,
      scaledAmount,
      refundValue,
      currency,
      description: this.refundDescription(paymentIntentId)
    }
  }

  private async getRefundGateHubWallet(
    validated: RefundValidationResult
  ): Promise<RefundGateHubWalletDetails | undefined> {
    const { refund, paymentIntentId, originalTx, account } = validated

    try {
      const walletAddress = await this.walletAddressService.getById({
        walletAddressId: originalTx.walletAddressId!,
        accountId: originalTx.accountId,
        userId: account.userId
      })
      const gateHubWallet =
        await this.accountService.getGateHubWalletAddress(walletAddress)

      return {
        gateHubWalletId: gateHubWallet.gateHubWalletId,
        gateHubUserId: gateHubWallet.gateHubUserId
      }
    } catch (error) {
      this.logger.error(
        'Wallet address not found or inactive for original payment',
        {
          refund_id: refund.id,
          payment_intent_id: paymentIntentId,
          wallet_address_id: originalTx.walletAddressId,
          error
        }
      )
      return
    }
  }

  private async hasSufficientBalanceForRefund(
    validated: RefundValidationResult
  ): Promise<boolean> {
    const { refund, paymentIntentId, account, refundValue, scaledAmount } =
      validated

    const availableBalance =
      await this.accountService.getAccountBalance(account)
    const availableValue = transformBalance(availableBalance, 2)

    if (availableValue < refundValue) {
      this.logger.error('Insufficient funds for refund reversal', {
        refund_id: refund.id,
        payment_intent_id: paymentIntentId,
        required: scaledAmount,
        available: availableBalance,
        required_value: refundValue.toString(),
        available_value: availableValue.toString()
      })
      return false
    }

    return true
  }

  private async reverseAndRecordRefund(
    validated: RefundValidationResult,
    gateHubWallet: RefundGateHubWalletDetails
  ): Promise<void> {
    const {
      refund,
      paymentIntentId,
      originalTx,
      scaledAmount,
      refundValue,
      currency,
      description
    } = validated

    try {
      await this.gateHubClient.createTransaction(
        {
          amount: scaledAmount,
          vault_uuid: this.gateHubClient.getVaultUuid(currency),
          sending_address: gateHubWallet.gateHubWalletId,
          receiving_address: this.env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
          type: TransactionTypeEnum.HOSTED,
          message: 'Stripe Refund'
        },
        gateHubWallet.gateHubUserId
      )

      await Transaction.query().insert({
        walletAddressId: originalTx.walletAddressId,
        accountId: originalTx.accountId,
        paymentId: refund.id,
        assetCode: currency,
        value: refundValue,
        type: 'OUTGOING',
        status: 'COMPLETED',
        description,
        source: 'Stripe'
      })
    } catch (error) {
      if (error instanceof UniqueViolationError) {
        this.logRefundAlreadyProcessed(refund.id)
        return
      }

      this.logger.error('Error reversing gatehub transaction for refund', {
        error,
        refund_id: refund.id,
        payment_intent_id: paymentIntentId
      })
      throw new Error('Failed to reverse transaction for refund')
    }
  }
}
