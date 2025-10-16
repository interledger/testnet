import { Card } from './model'
import { User } from '@/user/model'
import { BadRequest, NotFound } from '@shared/backend'
import { WalletAddressService } from '@/walletAddress/service'
import { Env } from '@/config/env'
import { generateKeyPairSync } from 'crypto'

type CreateCardArgs = {
  userId: string
  walletAddressId: string
  accountId: string
}

export type CreateCardResponse = {
  card: Card
  privateKey?: string
  publicKey?: string
}

interface IInterledgerCardService {
  create: (args: CreateCardArgs) => Promise<CreateCardResponse>
  list: (userId: string) => Promise<Card[]>
  getById: (userId: string, cardId: string) => Promise<Card>
  freeze: (userId: string, cardId: string) => Promise<void>
  unfreeze: (userId: string, cardId: string) => Promise<void>
  terminate: (userId: string, cardId: string) => Promise<void>
}

export class InterledgerCardService implements IInterledgerCardService {
  constructor(
    private walletAddressService: WalletAddressService,
    private env: Env
  ) {}

  public async create(args: CreateCardArgs): Promise<CreateCardResponse> {
    await this.walletAddressService.getById({
      userId: args.userId,
      accountId: args.accountId,
      walletAddressId: args.walletAddressId
    })

    let publicKeyPEM: undefined | string, privateKeyPEM: undefined | string

    if (this.env.GATEHUB_ENV !== 'production') {
      const { publicKey, privateKey } = generateKeyPairSync('ec', {
        namedCurve: 'P-256'
      })

      publicKeyPEM = publicKey
        .export({ type: 'spki', format: 'pem' })
        .toString()
      privateKeyPEM = privateKey
        .export({ type: 'pkcs8', format: 'pem' })
        .toString()
    }

    const card = await Card.query().insert({
      userId: args.userId,
      accountId: args.accountId,
      walletAddressId: args.walletAddressId,
      status: 'ORDERED',
      publicKey: publicKeyPEM
    })

    return {
      card,
      publicKey: publicKeyPEM,
      privateKey: privateKeyPEM
    }
  }

  public async list(userId: string): Promise<Card[]> {
    const user = await User.query().findById(userId)

    if (!user || !user.gateHubUserId) {
      throw new NotFound()
    }

    return await Card.query()
      .where('userId', userId)
      .withGraphFetched('walletAddress')
  }

  public async getById(userId: string, cardId: string): Promise<Card> {
    const user = await User.query().findById(userId)

    if (!user || !user.gateHubUserId) {
      throw new NotFound()
    }

    const card = await Card.query()
      .findById(cardId)
      .withGraphFetched('walletAddress')

    if (!card) {
      throw new NotFound()
    }

    return card
  }

  async activate(userId: string, cardId: string) {
    const card = await this.getById(userId, cardId)
    if (card.status !== 'ORDERED') {
      throw new BadRequest('Incorrect status')
    }

    await card.$query().patch({
      status: 'ACTIVE'
    })
  }

  async freeze(userId: string, cardId: string) {
    const card = await this.getById(userId, cardId)
    if (card.status !== 'ACTIVE') {
      throw new BadRequest('Incorrect status')
    }

    await card.$query().patch({
      status: 'FROZEN'
    })
  }

  async unfreeze(userId: string, cardId: string) {
    const card = await this.getById(userId, cardId)
    if (card.status !== 'FROZEN') {
      throw new BadRequest('Incorrect status')
    }

    await card.$query().patch({
      status: 'ACTIVE'
    })
  }

  async terminate(userId: string, cardId: string) {
    const card = await this.getById(userId, cardId)
    if (card.status === 'TERMINATED') {
      throw new BadRequest('Incorrect status')
    }

    await card.$query().patch({
      status: 'TERMINATED',
      publicKey: null
    })
  }
}
