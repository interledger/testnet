import { BadRequest } from '@shared/backend'
import { Logger } from 'winston'
import { GateHubClient } from '../gatehub/client'
import { Env } from '../config/env'
import { TransactionTypeEnum } from '../gatehub/consts'

export enum EventType {
  payment_intent_created = 'payment_intent.created',
  payment_intent_canceled = 'payment_intent.canceled',
  payment_intent_payment_failed = 'payment_intent.payment_failed',
  payment_intent_succeeded = 'payment_intent.succeeded',


  payment_intent_processing = 'payment_intent.processing',
  payment_intent_partially_funded = 'payment_intent.partially_funded',
  payment_intent_requires_action = 'payment_intent.requires_action',





}

export interface WebHook {
  id: string
  type: EventType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

const isValidEventType = (value: string): value is EventType => {
  return Object.values(EventType).includes(value as EventType)
}
interface IStripeService {
  onWebHook: (wh: WebHook) => Promise<void>
}

export class StripeService implements IStripeService {
  constructor(
    private env: Env,
    private logger: Logger,
    private gh: GateHubClient
  ) {}

  public async onWebHook(wh: WebHook): Promise<void> {
    this.logger.info(
      `received webhook of type : ${wh.type} for : ${wh.id}`
    )
    if (!isValidEventType(wh.type)) {
      throw new BadRequest(`unknown event type, ${wh.type}`)
    }


    switch (wh.type) {
      case EventType.payment_intent_succeeded:
        await this.handlePaymentIntentSucceeded(wh)


        break
    }
  }


  private async handlePaymentIntentSucceeded(wh: WebHook) {


    //TODO: instruct transactions from settlement account to gatehub user account based on wallet address and amount set on metadata

    console.log(wh);
    console.log('payment intent succeeded');
    const paymentIntent = wh.data.object;
    const metadata = wh.data.object.metadata;

    console.log({paymentIntent, metadata});


    const receiving_address: string = metadata.receiving_address;
    const currency: string = paymentIntent.currency;
    const amount: number = paymentIntent.amount;


    await this.gh.createTransaction({
      amount,
      vault_uuid: this.gh.getVaultUuid(currency),
      receiving_address,
      sending_address: this.env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
      type: TransactionTypeEnum.HOSTED,
      message: 'Stripe Transfer'
    })


  }




}
