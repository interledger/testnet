import { RafikiClient } from '@/rafiki/rafiki-client'
import { generateJwk, validateJwk } from '@/utils/jwk'
import { createPublicKey, generateKeyPairSync } from 'crypto'
import { v4 as uuid } from 'uuid'
import { WalletAddressKeys } from './model'
import { WalletAddressService } from '@/walletAddress/service'
import { WalletAddress } from '@/walletAddress/model'
import { NotFound } from '@/errors'

export type KeyResponse = {
  privateKey: string
  publicKey: string
  keyId: string
  nickname?: string
}

interface WalletAddressKeyArgs {
  userId: string
  accountId: string
  walletAddressId: string
}

interface RegisterKeyArgs extends WalletAddressKeyArgs {
  nickname?: string
}

interface UploadKeyArgs extends RegisterKeyArgs {
  base64Key: string
}

interface RevokeKeyArgs extends WalletAddressKeyArgs {
  keyId: string
}

interface PatchKeyArgs extends WalletAddressKeyArgs {
  keyId: string
  nickname: string
}

interface IWalletAddressKeyService {
  registerKey: (params: RegisterKeyArgs) => Promise<KeyResponse>
  revokeKey: (params: RevokeKeyArgs) => Promise<void>
  uploadKey: (params: UploadKeyArgs) => Promise<void>
  patch: (params: PatchKeyArgs) => Promise<void>
  lisByWalletId: (params: WalletAddressKeyArgs) => Promise<WalletAddressKeys[]>
}

export class WalletAddressKeyService implements IWalletAddressKeyService {
  constructor(
    private walletAddressService: WalletAddressService,
    private rafikiClient: RafikiClient
  ) {}

  async uploadKey({
    userId,
    accountId,
    walletAddressId,
    base64Key,
    nickname
  }: UploadKeyArgs): Promise<void> {
    const walletAddress = await this.walletAddressService.getById({
      userId,
      accountId,
      walletAddressId
    })

    const jwk = validateJwk(
      JSON.parse(new Buffer(base64Key, 'base64').toString())
    )
    const publicKey = createPublicKey({ key: jwk, format: 'jwk' })
    const publicKeyPEM = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString()

    const walletAddressKey =
      await this.rafikiClient.createRafikiWalletAddressKey(
        jwk,
        walletAddress.id
      )

    const key = {
      id: jwk.kid,
      nickname,
      rafikiId: walletAddressKey.id,
      publicKey: publicKeyPEM,
      walletAddressId
    }

    await WalletAddressKeys.query().insert(key)
  }

  async registerKey({
    userId,
    accountId,
    walletAddressId,
    nickname
  }: RegisterKeyArgs): Promise<KeyResponse> {
    const walletAddress = await this.walletAddressService.getById({
      userId,
      accountId,
      walletAddressId
    })
    const { privateKey, publicKey } = generateKeyPairSync('ed25519')
    const publicKeyPEM = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString()
    const privateKeyPEM = privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString()
    const keyId = uuid()

    const walletAddressKey =
      await this.rafikiClient.createRafikiWalletAddressKey(
        generateJwk(privateKey, keyId),
        walletAddress.id
      )

    const key = {
      id: keyId,
      nickname,
      rafikiId: walletAddressKey.id,
      publicKey: publicKeyPEM,
      walletAddressId
    }

    await WalletAddressKeys.query().insert(key)

    return {
      privateKey: privateKeyPEM,
      publicKey: publicKeyPEM,
      keyId: key.id,
      nickname
    }
  }

  async revokeKey({
    userId,
    accountId,
    walletAddressId,
    keyId
  }: RevokeKeyArgs): Promise<void> {
    await this.walletAddressService.getById({
      userId,
      accountId,
      walletAddressId
    })

    const walletAddressKey = await this.getById(walletAddressId, keyId)

    const trx = await WalletAddress.startTransaction()

    try {
      await Promise.all([
        walletAddressKey.$query(trx).delete(),
        this.rafikiClient.revokeWalletAddressKey(walletAddressKey.rafikiId)
      ])
      await trx.commit()
    } catch (e) {
      await trx.rollback()
    }
  }

  async patch({
    userId,
    accountId,
    walletAddressId,
    keyId,
    nickname
  }: PatchKeyArgs): Promise<void> {
    await this.walletAddressService.getById({
      userId,
      accountId,
      walletAddressId
    })

    const walletAddressKey = await this.getById(walletAddressId, keyId)

    await walletAddressKey.$query().patch({ nickname })
  }

  async lisByWalletId({
    userId,
    accountId,
    walletAddressId
  }: WalletAddressKeyArgs): Promise<WalletAddressKeys[]> {
    await this.walletAddressService.getById({
      userId,
      accountId,
      walletAddressId
    })

    return await WalletAddressKeys.query().where({ walletAddressId })
  }

  async getById(walletAddressId: string, id: string) {
    const key = await WalletAddressKeys.query()
      .findById(id)
      .where('walletAddressId', walletAddressId)

    if (!key) {
      throw new NotFound()
    }

    return key
  }
}
