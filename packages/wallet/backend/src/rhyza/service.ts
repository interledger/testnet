import { WebhookType } from './validation'
import { Logger } from 'winston'
import { TransactionService } from '@/transaction/service'
import { WalletAddressService } from '@/walletAddress/service'

export enum EventType {
  PaymentIntentCreated = 'payment_intent.created'
}

export interface WebHook {
  id: string
  type: EventType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

interface IRhyzaService {
  onWebHook: (wh: WebhookType) => Promise<void>
}

export class RhyzaService implements IRhyzaService {
  constructor(
    private logger: Logger,
    private transactionService: TransactionService,
    private walletAddressService: WalletAddressService
  ) {}

  public async onWebHook(wh: WebhookType): Promise<void> {
    this.logger.info(`received webhook of type ${wh.type} with id ${wh.id}`)

    switch (wh.type) {
      case EventType.PaymentIntentCreated:
        await this.handlePaymentIntentCreated(wh)
        break
    }
  }

  async getWalletAddress(wh: WebHook) {
    const id: string = wh.data?.walletAddressId || wh.data?.walletAddressId
    return await this.walletAddressService.findByIdWithoutValidation(id)
  }

  private async handlePaymentIntentCreated(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)

    await this.transactionService.createIncomingTransaction(
      wh.data,
      walletAddress
    )
  }
}
