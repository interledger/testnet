import { Conflict, NotFound } from '@/errors'
import { PaymentPointer } from './model'
import { Env } from '@/config/env'
import { AccountService } from '@/account/service'
import { RafikiClient } from '@/rafiki/rafiki-client'
import crypto from 'crypto'
import { Alg, Crv, Kty } from '@/rafiki/generated/graphql'

interface IPaymentPointerService {
  create: (
    userId: string,
    accountId: string,
    paymentPointerName: string,
    publicName: string
  ) => Promise<PaymentPointer>
  list: (userId: string, accountId: string) => Promise<PaymentPointer[]>
  getById: (
    userId: string,
    accountId: string,
    id: string
  ) => Promise<PaymentPointer>
  softDelete: (userId: string, id: string) => Promise<void>
}

interface PaymentPointerServiceDependencies {
  accountService: AccountService
  rafikiClient: RafikiClient
  env: Env
}

export class PaymentPointerService implements IPaymentPointerService {
  constructor(private deps: PaymentPointerServiceDependencies) {}

  async create(
    userId: string,
    accountId: string,
    paymentPointerName: string,
    publicName: string
  ): Promise<PaymentPointer> {
    const account = await this.deps.accountService.findAccountById(
      accountId,
      userId
    )
    const url = `${this.deps.env.OPEN_PAYMENTS_HOST}/${paymentPointerName}`
    let paymentPointer = await PaymentPointer.query().findOne({ url })

    if (paymentPointer) {
      if (paymentPointer.accountId != accountId || account.userId !== userId) {
        throw new Conflict(
          'This payment pointer already exists. Please choose another name.'
        )
      } else if (
        paymentPointer.accountId === accountId &&
        account.userId === userId
      ) {
        paymentPointer = await PaymentPointer.query().patchAndFetchById(
          paymentPointer.id,
          {
            publicName,
            active: true
          }
        )
      }
    } else {
      const rafikiPaymentPointer =
        await this.deps.rafikiClient.createRafikiPaymentPointer(
          publicName,
          account.assetId,
          url
        )

      paymentPointer = await PaymentPointer.query().insert({
        url: rafikiPaymentPointer.url,
        publicName,
        accountId,
        id: rafikiPaymentPointer.id
      })
    }

    return paymentPointer
  }

  async list(userId: string, accountId: string): Promise<PaymentPointer[]> {
    // Validate that account id belongs to current user
    const account = await this.deps.accountService.findAccountById(
      accountId,
      userId
    )

    return PaymentPointer.query()
      .where('accountId', account.id)
      .where('active', true)
  }

  async getById(
    userId: string,
    accountId: string,
    id: string
  ): Promise<PaymentPointer> {
    // Validate that account id belongs to current user
    await this.deps.accountService.findAccountById(accountId, userId)

    const paymentPointer = await PaymentPointer.query()
      .findById(id)
      .where('accountId', accountId)
      .where('active', true)

    if (!paymentPointer) {
      throw new NotFound()
    }

    return paymentPointer
  }

  /**
   * This is a soft delete functionality. The payment pointer will never be
   * deleted. We will change its `active` column to `false` when the user
   * wants to delete it.
   * */
  async softDelete(userId: string, id: string): Promise<void> {
    const paymentPointer = await PaymentPointer.query().findById(id)

    if (!paymentPointer) {
      throw new NotFound()
    }

    // Check if the user owns the payment pointer.
    // This function throws a NotFoundException.
    await this.deps.accountService.findAccountById(
      paymentPointer.accountId,
      userId
    )
    await PaymentPointer.query().findById(id).patch({
      active: false
    })
  }

  async generateKeyPair(): Promise<{ privateKey: string; publicKey: string }> {
    // Generate the key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048, // Key size in bits
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem' // You can also use 'der' format if needed
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem' // You can also use 'der' format if needed
      }
    })

    return { privateKey, publicKey }
  }

  async registerKey(
    userId: string,
    paymentPointerId: string,
    publicKey: string
  ): Promise<void> {
    const paymentPointer = await PaymentPointer.query().findById(paymentPointerId)

    if (!paymentPointer) {
      throw new NotFound()
    }

    // Check if the user owns the payment pointer.
    // This function throws a NotFoundException.
    await this.deps.accountService.findAccountById(
      paymentPointer.accountId,
      userId
    )

    const publicKeyValue = publicKey
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\n/g, '')

    const jwk = {
      alg: Alg.EdDsa,
      crv: Crv.Ed25519,
      kid: 'your-key-id',
      kty: Kty.Okp,
      x: publicKeyValue
    }

    await this.deps.rafikiClient.createRafikiPaymentPointerKey(
      jwk,
      paymentPointerId
    )
  }
  async getAllACcount(): Promise<any>
  {

    const allAccount = await PaymentPointer.query()
    
    return allAccount 
  }
}
