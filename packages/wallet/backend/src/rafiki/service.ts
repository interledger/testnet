import { Env } from '@/config/env'
import { GateHubClient } from '@/gatehub/client'
import { TransactionTypeEnum } from '@/gatehub/consts'
import MessageType from '@/socket/messageType'
import { SocketService } from '@/socket/service'
import { ISecondParty, TransactionService } from '@/transaction/service'
import { NodeCacheInstance } from '@/utils/helpers'
import { WalletAddressService } from '@/walletAddress/service'
import { BadRequest } from '@shared/backend'
import { Logger } from 'winston'
import { AccountService } from '../account/service'
import { RafikiClient } from './rafiki-client'
import { cardDetailsSchema, WebhookType } from './validation'
import { validate } from '@/shared/validate'
import {
  DOL,
  hexToUint8Array,
  parsePinBlock,
  uint8ArrayToAscii,
  uint8ArrayToHex
} from '@interledger/tlv-kit'
import { TLVParser } from '@interledger/tlv-kit'

export enum EventType {
  IncomingPaymentCreated = 'incoming_payment.created',
  IncomingPaymentCompleted = 'incoming_payment.completed',
  IncomingPaymentExpired = 'incoming_payment.expired',
  OutgoingPaymentCreated = 'outgoing_payment.created',
  OutgoingPaymentCompleted = 'outgoing_payment.completed',
  OutgoingPaymentFailed = 'outgoing_payment.failed',
  WalletAddressNotFound = 'wallet_address.not_found'
}

export interface WebHook {
  id: string
  type: EventType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

export interface AmountJSON {
  value: string
  assetCode: string
  assetScale: number
}

export interface Amount {
  value: bigint
  assetCode: string
  assetScale: number
}

export enum PaymentType {
  FixedSend = 'FixedSend',
  FixedDelivery = 'FixedDelivery'
}

export type Quote = {
  id: string
  paymentType: PaymentType
  walletAddressId: string
  receiver: string
  debitAmount: Amount
  receiveAmount: Amount
  maxPacketAmount?: bigint
  minExchangeRate?: number
  lowEstimatedExchangeRate?: number
  highEstimatedExchangeRate?: number
  createdAt: string
  expiresAt: string
}

type Fee = {
  fixed: number
  percentage: number
  scale: number
}

export type Fees = Record<string, Fee>

interface IRafikiService {
  onWebHook: (wh: WebhookType) => Promise<void>
}

export class RafikiService implements IRafikiService {
  constructor(
    private socketService: SocketService,
    private gateHubClient: GateHubClient,
    private env: Env,
    private logger: Logger,
    private rafikiClient: RafikiClient,
    private transactionService: TransactionService,
    private walletAddressService: WalletAddressService,
    private accountService: AccountService
  ) {}

  public async onWebHook(wh: WebhookType): Promise<void> {
    this.logger.info(
      `received webhook of type : ${wh.type} for : ${
        wh.type === EventType.WalletAddressNotFound ? '' : `${wh.id}}`
      }`
    )

    switch (wh.type) {
      case EventType.OutgoingPaymentCreated:
        await this.handleOutgoingPaymentCreated(wh)
        break
      case EventType.OutgoingPaymentCompleted:
        await this.handleOutgoingPaymentCompleted(wh)
        break
      case EventType.OutgoingPaymentFailed:
        await this.handleOutgoingPaymentFailed(wh)
        break
      case EventType.IncomingPaymentCompleted:
        await this.handleIncomingPaymentCompleted(wh)
        break
      case EventType.IncomingPaymentCreated:
        await this.handleIncomingPaymentCreated(wh)
        break
      case EventType.IncomingPaymentExpired:
        await this.handleIncomingPaymentExpired(wh)
        break
      case EventType.WalletAddressNotFound:
        this.logger.warn(`${EventType.WalletAddressNotFound} received`)
        break
    }
  }

  private parseAmount(amount: AmountJSON): Amount {
    return { ...amount, value: BigInt(amount.value) }
  }

  private getAmountFromWebHook(wh: WebHook): Amount {
    let amount
    if (
      [
        EventType.OutgoingPaymentCreated,
        EventType.OutgoingPaymentCompleted,
        EventType.OutgoingPaymentFailed
      ].includes(wh.type)
    ) {
      amount = this.parseAmount(wh.data.debitAmount as AmountJSON)
    }

    if (
      [
        EventType.IncomingPaymentCompleted,
        EventType.IncomingPaymentExpired
      ].includes(wh.type)
    ) {
      amount = this.parseAmount(wh.data.receivedAmount as AmountJSON)
    }

    if (!amount) {
      throw new BadRequest('Unable to extract amount from webhook')
    }

    return amount
  }

  private amountToNumber(
    amount: Amount,
    toAssetScale: number = amount.assetScale
  ): number {
    const factor = 10 ** toAssetScale
    const scaledValue = Number(amount.value) * 10 ** -amount.assetScale
    const truncatedValue = Math.floor(scaledValue * factor) / factor
    return truncatedValue
  }

  private async handleIncomingPaymentCompleted(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)
    const amount = this.getAmountFromWebHook(wh)

    const { gateHubWalletId: receiverWallet, userId } =
      await this.accountService.getGateHubWalletAddress(walletAddress)

    if (!this.validateAmount(amount, wh.type)) {
      //* Only in case the expired incoming payment has no money received will it be set as expired.
      //* Otherwise, it will complete, even if not all the money is yet sent.
      if (wh.type === EventType.IncomingPaymentExpired) {
        await this.transactionService.updateTransaction(
          { paymentId: wh.data.id },
          { status: 'EXPIRED' }
        )
      }
      return
    }

    await this.gateHubClient.createTransaction({
      amount: this.amountToNumber(amount),
      vault_uuid: this.gateHubClient.getVaultUuid(amount.assetCode),
      receiving_address: receiverWallet,
      sending_address: this.env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
      type: TransactionTypeEnum.HOSTED,
      message: 'Transfer'
    })

    await this.rafikiClient.withdrawLiqudity(wh.id)

    const secondParty = await this.getIncomingPaymentSenders(wh.data.id)

    await this.transactionService.updateTransaction(
      { paymentId: wh.data.id },
      {
        status: 'COMPLETED',
        value: amount.value,
        secondParty: secondParty?.names,
        secondPartyWA: secondParty?.walletAddresses
      }
    )

    const isExchange = NodeCacheInstance.get(wh.data.id)
    if (userId && !isExchange)
      await this.socketService.emitMoneyReceivedByUserId(
        userId.toString(),
        amount
      )

    this.logger.info(
      `Succesfully transfered ${this.amountToNumber(
        amount
      )} from settlement account ${
        this.env.GATEHUB_SETTLEMENT_WALLET_ADDRESS
      } into ${receiverWallet} `
    )
  }

  private async handleIncomingPaymentCreated(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)

    await this.transactionService.createIncomingTransaction(
      wh.data,
      walletAddress
    )
  }

  private async handleOutgoingPaymentCreated(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)
    const amount = this.getAmountFromWebHook(wh)

    const { gateHubWalletId, gateHubUserId } =
      await this.accountService.getGateHubWalletAddress(walletAddress)

    if (!this.validateAmount(amount, wh.type)) {
      return
    }

    const secondParty = await this.getOutgoingPaymentSecondPartyByReceiver(
      wh.data.receiver
    )

    await this.transactionService.createOutgoingTransaction(
      wh.data,
      walletAddress,
      secondParty
    )

    const balance = await this.getWalletBalance(
      gateHubWalletId,
      gateHubUserId,
      amount.assetCode
    )
    const amountValue = this.amountToNumber(amount)

    if (balance < amountValue) {
      this.logger.info(
        `Insufficient funds. Payment amount ${amountValue}, balance ${balance}`
      )
      throw new Error('Insufficient funds')
    }

    // Check if is card payment
    if (wh.data?.cardDetails) {
      const cardDetails = await validate(cardDetailsSchema, wh.data.cardDetails)
      await this.processCardPayment(cardDetails.data.payload)
      return
    }

    await this.rafikiClient.depositLiquidity(wh.id)

    this.logger.info(
      `Succesfully held ${amountValue} in ${gateHubWalletId}  on ${EventType.OutgoingPaymentCreated}`
    )
  }

  private async handleOutgoingPaymentCompleted(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)
    const debitAmount = this.getAmountFromWebHook(wh)

    const {
      gateHubWalletId: sendingWallet,
      userId,
      gateHubUserId
    } = await this.accountService.getGateHubWalletAddress(walletAddress)

    if (!this.validateAmount(debitAmount, wh.type)) {
      return
    }

    await this.gateHubClient.createTransaction(
      {
        amount: this.amountToNumber(debitAmount),
        vault_uuid: this.gateHubClient.getVaultUuid(debitAmount.assetCode),
        sending_address: sendingWallet,
        receiving_address: this.env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
        type: TransactionTypeEnum.HOSTED,
        message: 'Transfer'
      },
      gateHubUserId
    )

    if (wh.data.balance !== '0') {
      await this.rafikiClient.withdrawLiqudity(wh.id)
    }

    await this.transactionService.updateTransaction(
      { paymentId: wh.data.id },
      { status: 'COMPLETED', value: debitAmount.value }
    )

    const isExchange = NodeCacheInstance.get(wh.data.id)
    if (userId && !isExchange) {
      const messageType =
        wh.data.metadata?.type === 'instant'
          ? MessageType.MONEY_SENT_SHOP
          : MessageType.MONEY_SENT
      await this.socketService.emitMoneySentByUserId(
        userId.toString(),
        debitAmount,
        messageType
      )
    }

    this.logger.info(
      `Succesfully transfered ${this.amountToNumber(
        debitAmount
      )} from ${sendingWallet} to settlement account on ${
        EventType.OutgoingPaymentCompleted
      }`
    )
  }

  private async handleOutgoingPaymentFailed(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)
    const debitAmount = this.getAmountFromWebHook(wh)

    if (!this.validateAmount(debitAmount, wh.type)) {
      return
    }

    const sentAmount = this.parseAmount(wh.data.sentAmount as AmountJSON)

    const { gateHubWalletId: sendingWallet } =
      await this.accountService.getGateHubWalletAddress(walletAddress)

    await this.transactionService.updateTransaction(
      { paymentId: wh.data.id },
      { status: 'FAILED', value: 0n }
    )

    if (!sentAmount.value) {
      return
    }

    await this.gateHubClient.createTransaction({
      amount: this.amountToNumber(sentAmount),
      vault_uuid: this.gateHubClient.getVaultUuid(sentAmount.assetCode),
      sending_address: sendingWallet,
      receiving_address: this.env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
      type: TransactionTypeEnum.HOSTED,
      message: 'Transfer'
    })

    await this.rafikiClient.withdrawLiqudity(wh.id)

    await this.transactionService.updateTransaction(
      { paymentId: wh.data.id },
      { status: 'COMPLETED', value: sentAmount.value }
    )
  }

  private async handleIncomingPaymentExpired(wh: WebHook) {
    return this.handleIncomingPaymentCompleted(wh)
  }

  private validateAmount(amount: Amount, eventType: EventType): boolean {
    if (amount.value > 0n) {
      return true
    }
    this.logger.warn(
      `${eventType} received with zero or negative value. Skipping interaction`
    )

    return false
  }

  async getWalletAddress(wh: WebHook) {
    const id: string = wh.data?.walletAddressId || wh.data?.walletAddressId
    return await this.walletAddressService.findByIdWithoutValidation(id)
  }

  async getIncomingPaymentSenders(
    id: string
  ): Promise<ISecondParty | undefined> {
    try {
      const outgoingPayments =
        await this.rafikiClient.getOutgoingPaymentsByReceiver(
          `${this.env.OPEN_PAYMENTS_HOST}/incoming-payments/${id}`
        )

      const walletAddressIds = outgoingPayments.map(
        (payment) => payment.walletAddressId
      )
      const walletAddresses =
        await this.walletAddressService.getByIds(walletAddressIds)
      // return senders
      return {
        names: walletAddresses
          .filter((wa) => wa.account?.user)
          .map(
            (wa) => `${wa.account.user.firstName} ${wa.account.user.lastName}`
          )
          .join(', '),
        walletAddresses: walletAddresses.map((wa) => wa.url).join(', ')
      }
    } catch (e) {
      this.logger.warn(
        'Error on getting outgoing payments by incoming payment',
        e
      )
    }
  }

  async getOutgoingPaymentSecondPartyByReceiver(receiverId: string) {
    try {
      const receiver = await this.rafikiClient.getReceiverById(receiverId)
      const receiverWA = await this.walletAddressService.getByUrl(
        receiver.walletAddressUrl
      )

      const response: ISecondParty = {
        walletAddresses: receiver.walletAddressUrl
      }

      if (receiverWA?.account?.user) {
        response.names = `${receiverWA.account.user.firstName} ${receiverWA.account.user.lastName}`
      }

      return response
    } catch (e) {
      this.logger.warn('Error on getting receiver wallet address', e)
    }
  }

  async getOutgoingPaymentSecondPartyByIncomingPaymentId(
    paymentId: string
  ): Promise<ISecondParty | undefined> {
    try {
      const receiver = await this.rafikiClient.getIncomingPaymentById(paymentId)

      const receiverWA = await this.walletAddressService.getByIdWIthUserDetails(
        receiver.walletAddressId
      )

      if (receiverWA?.account?.user) {
        return {
          names: `${receiverWA.account.user.firstName} ${receiverWA.account.user.lastName}`,
          walletAddresses: receiverWA.url
        }
      }
    } catch (e) {
      this.logger.warn('Error on getting receiver wallet address', e)
    }
  }

  async getWalletBalance(
    gateHubWalletId: string,
    gateHubUserId: string,
    assetCode: string
  ) {
    const balances = await this.gateHubClient.getWalletBalance(
      gateHubWalletId,
      gateHubUserId
    )

    return Number(
      balances.find((balance) => balance.vault.asset_code === assetCode)
        ?.available ?? 0
    )
  }

  async processCardPayment(payload: string): Promise<boolean> {
    // Parse TLV data
    const tlv = TLVParser(payload)[0]
    if (!tlv) throw new Error('No TLV data found')

    // Check if tag is 0x77
    if (tlv.getTag()[0] !== 0x77) throw new Error('Invalid TLV tag')

    // Extract terminal data
    const data = {
      cryptogramType: tlv.getChild('9F27')?.getValue(),
      atc: tlv.getChild('9F36')?.getValue(),
      cryptogram: tlv.getChild('9F26')?.getValue(),
      amountAuthorized: tlv.getChild('9F02')?.getValue(),
      currencyCode: tlv.getChild('5F2A')?.getValue(),
      currencyExponent: tlv.getChild('5F36')?.getValue(),
      transactionDate: tlv.getChild('9A')?.getValue(),
      transactionTime: tlv.getChild('9F21')?.getValue(),
      unpredictableNumber: tlv.getChild('9F37')?.getValue(),
      receiverWalletAddress: tlv.getChild('DF01')?.getValue(),
      senderWalletAddress: tlv.getChild('DF02')?.getValue(),
      pinBlock: tlv.getChild('99')?.getValue(),
      pinTryCounter: tlv.getChild('9F17')?.getValue()
    }

    if (!data.senderWalletAddress)
      throw new Error('Missing sender wallet address')

    // Get card data
    const cardData = this.getCardData(
      uint8ArrayToAscii(data.senderWalletAddress)
    )

    // Check PIN try counter
    if (cardData.pinTryCounter > cardData.pinTryLimit)
      throw new Error('Card blocked, no PIN tries left')

    // Build payload for cryptogram verification (rebuild GEN AC data input)
    let cdol1Data: Uint8Array = new Uint8Array()
    new DOL(cardData.cdol1).getFields().forEach((field) => {
      const value = tlv.getChild(field.tag)?.getValue()
      if (!value) throw new Error(`Missing field ${uint8ArrayToHex(field.tag)}`)
      let valuePadded = new Uint8Array(field.length)
      valuePadded.set(value.slice(0, field.length))
      valuePadded = valuePadded.fill(0x00, value.length)
      cdol1Data = new Uint8Array([...cdol1Data, ...valuePadded])
    })

    // Verify Unpredictable Number
    if (
      !data.unpredictableNumber ||
      data.unpredictableNumber.length !== 4 ||
      uint8ArrayToHex(data.unpredictableNumber) ===
        uint8ArrayToHex(cardData.lastUnpredictableNumber)
    )
      throw new Error('Missing or invalid Unpredictable Number')

    // Verify ATC
    if (!data.atc || data.atc.length !== 2)
      throw new Error('Missing or invalid ATC')
    const atcValue = (data.atc[0] << 8) | data.atc[1]
    if (atcValue <= cardData.atc)
      throw new Error(`Invalid ATC value: ${atcValue}, last: ${cardData.atc}`)

    // Verify transaction date
    if (!data.transactionDate || data.transactionDate.length !== 3)
      throw new Error('Missing or invalid transaction date')
    if (!data.transactionTime || data.transactionTime.length !== 3)
      throw new Error('Missing or invalid transaction time')

    const transactionDate = this.getTransactionDate(
      data.transactionDate,
      data.transactionTime
    )

    // Calculate difference between now and transaction date
    const now = new Date()
    const diff = Math.abs(now.getTime() - transactionDate.getTime())
    const diffHours = Math.floor(diff / (1000 * 60 * 60))
    if (diffHours > 1) throw new Error('Transaction date is too old')

    // Verify cryptogram
    await this.verifyCryptogram(
      data.cryptogramType,
      data.atc,
      data.cryptogram,
      cdol1Data,
      cardData
    )

    // Get Amount and currency
    if (!data.amountAuthorized) throw new Error('Missing amount authorized')
    if (!data.currencyCode) throw new Error('Missing currency code')
    if (!data.currencyExponent) throw new Error('Missing currency exponent')

    // Only EUR (0978) is supported for now
    const currency = uint8ArrayToHex(data.currencyCode)
    const EUR_CURRENCY_CODE = '0978'
    if (currency !== EUR_CURRENCY_CODE) throw new Error('Unsupported currency')

    const amount = Number.parseInt(uint8ArrayToHex(data.amountAuthorized))
    const exponent = Number.parseInt(uint8ArrayToHex(data.currencyExponent))
    const amountInUnits = amount * Math.pow(10, exponent * -1)

    // Verify PIN if amount >= 100 EUR
    if (amountInUnits >= cardData.amountThresholdForPin) {
      if (!data.pinBlock) throw new Error('Missing PIN block')
      if (!data.pinTryCounter) throw new Error('Missing PIN try counter')

      const pin = parsePinBlock(
        uint8ArrayToHex(data.pinBlock),
        uint8ArrayToHex(data.senderWalletAddress).replace(/\D/g, ''),
        'ISO-1'
      )

      if (cardData.pin !== pin) {
        // Increment PIN try counter
        cardData.pinTryCounter++
        const triesLeft = cardData.pinTryLimit - cardData.pinTryCounter
        throw new Error(`Invalid PIN, ${triesLeft} tries left`)
      }
    }

    return true
  }

  async verifyCryptogram(
    cryptogramType: Uint8Array | undefined,
    atc: Uint8Array | undefined,
    signature: Uint8Array | undefined,
    payload: Uint8Array,
    cardData: ReturnType<typeof this.getCardData>
  ) {
    if (!cryptogramType) throw new Error('Missing cryptogram type')
    if (!atc) throw new Error('Missing ATC')
    if (!signature) throw new Error('Missing cryptogram signature')

    let isValid

    switch (uint8ArrayToHex(cryptogramType)) {
      // ARQC
      case '80': {
        if (signature.length !== 8) throw new Error('Invalid signature length')

        const CONTEXT_SIZE = 2048
        let context = new Uint8Array(CONTEXT_SIZE)
        context.set(payload.subarray(0, payload.length))
        context = context.fill(0x00, payload.length)

        const verifier = new AES128Verifier(cardData.symmetricKey, atc)
        isValid = verifier.verify(context, signature)

        if (!isValid) throw new Error('Invalid cryptogram signature')
        break
      }
      // P256
      case 'C1': {
        if (signature.length !== 72) throw new Error('Invalid signature length')

        const verifier = new ECDSAP256Verifier(cardData.asymmetricKey)
        isValid = await verifier.verify(payload, signature)

        if (!isValid) throw new Error('Invalid cryptogram signature')
        break
      }
      default:
        throw new Error('Unknown cryptogram type')
    }
  }

  getCardData(_walletAddress: string) {
    return {
      symmetricKey: hexToUint8Array(process.env.CARD_AES_KEY || ''),
      asymmetricKey: process.env.CARD_ECDSA_KEY || '',
      atc: -1,
      pin: '1234',
      pinTryCounter: 0,
      lastUnpredictableNumber: hexToUint8Array('04C0FFEE'),
      cdol1: hexToUint8Array(
        '9f36029f02065f2a025f36019a039f21039f3704df0140df0240'
      ),
      pinTryLimit: 5,
      amountThresholdForPin: 100
    }
  }

  getTransactionDate(
    transactionDate: Uint8Array,
    transactionTime: Uint8Array
  ): Date {
    const date = uint8ArrayToHex(transactionDate)
    const year = 2000 + Number.parseInt(date.slice(0, 2))
    const month = Number.parseInt(date.slice(2, 4)) - 1
    const day = Number.parseInt(date.slice(4, 6))
    const time = uint8ArrayToHex(transactionTime)
    const hours = Number.parseInt(time.slice(0, 2))
    const minutes = Number.parseInt(time.slice(2, 4))
    const seconds = Number.parseInt(time.slice(4, 6))

    return new Date(Date.UTC(year, month, day, hours, minutes, seconds))
  }
}

// Dummy classes, will be removed when importing new tlv-kit version with these verifiers
class AES128Verifier {
  constructor(..._args: unknown[]) {}
  verify(..._args: unknown[]) {
    return true
  }
}

class ECDSAP256Verifier {
  constructor(..._args: unknown[]) {}
  async verify(..._args: unknown[]) {
    return true
  }
}
