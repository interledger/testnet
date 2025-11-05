import { Card } from './model'
import { User } from '@/user/model'
import { BadRequest, NotFound } from '@shared/backend'
import { WalletAddressService } from '@/walletAddress/service'
import { generateKeyPairSync } from 'crypto'
import {
  DOL,
  hexToUint8Array,
  parsePinBlock,
  uint8ArrayToAscii,
  uint8ArrayToHex,
  TLVParser,
  AES128Verifier,
  ECDSAP256Verifier
} from '@interledger/tlv-kit'
import { Logger } from 'winston'

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

const MAX_HOURS_DIFF = 24
const CDOL1 = hexToUint8Array(
  '9f36029f02065f2a025f36019a039f21039f3704df0140df0240'
)

interface IInterledgerCardService {
  create: (args: CreateCardArgs) => Promise<CreateCardResponse>
  list: (userId: string) => Promise<Card[]>
  getById: (userId: string, cardId: string) => Promise<Card>
  freeze: (userId: string, cardId: string) => Promise<void>
  unfreeze: (userId: string, cardId: string) => Promise<void>
  terminate: (userId: string, cardId: string) => Promise<void>
  processCardPayment: (
    payload: string,
    card: Card,
    walletAddress: string
  ) => Promise<boolean>
}

export class InterledgerCardService implements IInterledgerCardService {
  constructor(
    private walletAddressService: WalletAddressService,
    private logger: Logger
  ) {}

  public async create(args: CreateCardArgs): Promise<CreateCardResponse> {
    await this.walletAddressService.getById({
      userId: args.userId,
      accountId: args.accountId,
      walletAddressId: args.walletAddressId
    })

    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256'
    })

    const publicKeyPEM = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString()
    const privateKeyPEM = privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString()

    const card = await Card.query().insert({
      userId: args.userId,
      accountId: args.accountId,
      walletAddressId: args.walletAddressId,
      status: 'ACTIVE',
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

  public async findActiveCardByWalletAddress(
    walletAddressId: string
  ): Promise<Card | undefined> {
    const card = await Card.query().findOne({
      walletAddressId,
      status: 'ACTIVE'
    })

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

  async processCardPayment(
    payload: string,
    cardData: Card,
    walletAddress: string
  ): Promise<boolean> {
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

    walletAddress = walletAddress.replace('https://', '$')
    const cardWalletAddress = uint8ArrayToAscii(data.senderWalletAddress)
      .replace(/\0/g, '')
      .trim()

    if (walletAddress !== cardWalletAddress) {
      throw new Error(
        `Invalid sender wallet address: ${cardWalletAddress}, expected: ${walletAddress}`
      )
    }

    // Check PIN try counter
    if (cardData.pinTryCounter > cardData.pinTryLimit)
      throw new Error('Card blocked, no PIN tries left')

    // Build payload for cryptogram verification (rebuild GEN AC data input)
    let cdol1Data: Uint8Array = new Uint8Array()
    new DOL(CDOL1).getFields().forEach((field) => {
      const value = tlv.getChild(field.tag)?.getValue()
      if (!value) throw new Error(`Missing field ${uint8ArrayToHex(field.tag)}`)
      let valuePadded = new Uint8Array(field.length)
      valuePadded.set(value.subarray(0, field.length))
      valuePadded = valuePadded.fill(0x00, value.length)
      cdol1Data = new Uint8Array([...cdol1Data, ...valuePadded])
    })

    // Verify Unpredictable Number
    if (
      !data.unpredictableNumber ||
      data.unpredictableNumber.length !== 4 ||
      uint8ArrayToHex(data.unpredictableNumber) ===
        cardData.lastUnpredictableNumber
    )
      throw new Error('Missing or invalid Unpredictable Number')

    // Verify ATC
    if (!data.atc || data.atc.length !== 2)
      throw new Error('Missing or invalid ATC')
    const atcValue = (data.atc[0] << 8) | data.atc[1]
    if (atcValue <= cardData.atc)
      throw new Error(`Invalid ATC value: ${atcValue}, last: ${cardData.atc}`)

    // Verify transaction date
    // this.verifyTransactionDate(
    //   data.transactionDate,
    //   data.transactionTime,
    //   MAX_HOURS_DIFF
    // )

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
    // This is NOT VERIFIED YET against the actual wallet asset code
    const currency = uint8ArrayToHex(data.currencyCode)
    const EUR_CURRENCY_CODE = '0978'
    if (currency !== EUR_CURRENCY_CODE) throw new Error('Unsupported currency')

    // TODO: Check that the wallet address asset code matches the currency code

    const amount = Number.parseInt(uint8ArrayToHex(data.amountAuthorized))
    const exponent = Number.parseInt(uint8ArrayToHex(data.currencyExponent))
    const amountInUnits = amount * Math.pow(10, exponent * -1)

    // Verify PIN if amount >= threshold
    if (
      cardData.amountThresholdForPin &&
      amountInUnits >= cardData.amountThresholdForPin
    ) {
      if (!data.pinBlock) throw new Error('Missing PIN block')
      if (!data.pinTryCounter) throw new Error('Missing PIN try counter')

      const pin = parsePinBlock(
        uint8ArrayToHex(data.pinBlock),
        uint8ArrayToHex(data.senderWalletAddress).replace(/\D/g, ''),
        'ISO-1'
      )

      if (cardData.pin !== pin) {
        // Increment PIN try counter
        this.incrementPinTryCounter(cardData)
        const triesLeft = cardData.pinTryLimit - (cardData.pinTryCounter + 1)
        throw new Error(`Invalid PIN, ${triesLeft} tries left`)
      }
    }

    return true
  }

  incrementPinTryCounter(card: Card) {
    card
      .$query()
      .patch({ pinTryCounter: card.pinTryCounter + 1 })
      .catch((err) => {
        this.logger.error(`Failed to increment PIN try counter: ${err.message}`)
      })
  }

  async verifyCryptogram(
    cryptogramType: Uint8Array | undefined,
    atc: Uint8Array | undefined,
    signature: Uint8Array | undefined,
    payload: Uint8Array,
    cardData: Card
  ) {
    if (!cryptogramType) throw new Error('Missing signature type')
    if (!atc) throw new Error('Missing ATC')
    if (!signature) throw new Error('Missing signature')

    let isValid

    switch (uint8ArrayToHex(cryptogramType)) {
      // ARQC
      case '80': {
        if (signature.length !== 8) throw new Error('Invalid signature length')
        if (!cardData.cmacKey) throw new Error('Missing CMAC key')

        const CONTEXT_SIZE = 2048
        let context = new Uint8Array(CONTEXT_SIZE)
        context.set(payload.subarray(0, payload.length))
        context = context.fill(0x00, payload.length)

        const verifier = new AES128Verifier(
          hexToUint8Array(cardData.cmacKey),
          atc
        )

        isValid = await verifier.verify(context, signature)

        if (!isValid) throw new Error('Invalid signature')
        break
      }
      // P256
      case 'C1': {
        if (signature.length !== 72) throw new Error('Invalid signature length')
        if (!cardData.publicKey) throw new Error('Missing public key')

        const verifier = new ECDSAP256Verifier(cardData.publicKey)
        isValid = await verifier.verify(payload, signature)

        if (!isValid) throw new Error('Invalid signature')
        break
      }
      default:
        throw new Error('Unknown signature type')
    }
  }

  verifyTransactionDate(
    tDate: Uint8Array | undefined,
    tTime: Uint8Array | undefined,
    maxHoursDiff = 1
  ): boolean {
    // Verify transaction date
    if (!tDate || tDate.length !== 3)
      throw new Error('Missing or invalid transaction date')
    if (!tTime || tTime.length !== 3)
      throw new Error('Missing or invalid transaction time')

    const date = uint8ArrayToHex(tDate)
    const year = 2000 + Number.parseInt(date.slice(0, 2))
    const month = Number.parseInt(date.slice(2, 4)) - 1
    const day = Number.parseInt(date.slice(4, 6))
    const time = uint8ArrayToHex(tTime)
    const hours = Number.parseInt(time.slice(0, 2))
    const minutes = Number.parseInt(time.slice(2, 4))
    const seconds = Number.parseInt(time.slice(4, 6))
    const transactionDate = new Date(
      Date.UTC(year, month, day, hours, minutes, seconds)
    )

    // Calculate difference between now and transaction date
    const now = new Date()
    const diff = Math.abs(now.getTime() - transactionDate.getTime())
    const diffHours = Math.floor(diff / (1000 * 60 * 60))
    if (diffHours > maxHoursDiff) throw new Error('Transaction date is too old')

    return true
  }
}
