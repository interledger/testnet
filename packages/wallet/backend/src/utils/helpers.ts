import { bcrypt } from 'hash-wasm'
import { ObjectWithAnyKeys } from '@/shared/types'
import { createHash, randomBytes } from 'crypto'
import NodeCache from 'node-cache'
import { env } from '@/config/env'
import { DEFAULT_ASSET_SCALE } from './consts'

export const transformAmount = (
  amount: string | bigint,
  scale: number
): string => {
  const value = BigInt(amount)
  const divisor = BigInt(10 ** scale)

  const integerPart = (value / divisor).toString()
  const fractionalPart = (value % divisor).toString().padStart(scale, '0')

  return `${integerPart}.${fractionalPart}`
}

export const urlToPaymentId = (url: string) =>
  url.split('/incoming-payments/')[1]

export const transformBalance = (value: number, scale: number): bigint => {
  return BigInt(Math.floor(value * 10 ** scale))
}

export const applyScale = (
  value: number,
  scale: number = DEFAULT_ASSET_SCALE
): number => {
  const factor = 10 ** scale
  const scaledValue = value * 10 ** -scale
  const truncatedValue = Math.floor(scaledValue * factor) / factor
  return truncatedValue
}

export function extractUuidFromUrl(url: string): string {
  const { pathname } = new URL(url)
  const id = pathname.match(
    /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
  )?.[0]

  if (!id) {
    throw new Error('Uuid is not present in url')
  }

  return id
}

export const incomingPaymentRegexp =
  /\/incoming-payments\/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/

export const encryptPassword = (password: string) => {
  return bcrypt({
    password,
    salt: randomBytes(16),
    costFactor: 10,
    outputType: 'encoded'
  })
}

export const hashToken = (token: string) => {
  return createHash('sha256').update(token).digest('hex')
}

export const getRandomToken = (): string => {
  return randomBytes(32).toString('hex')
}

export const replaceObjectKey = (
  obj: ObjectWithAnyKeys,
  replacedKey: string,
  newKey: string
): ObjectWithAnyKeys =>
  Object.keys(obj).reduce(
    (acc, oldKey) => ({
      ...acc,
      [oldKey === replacedKey ? newKey : oldKey]: obj[oldKey]
    }),
    {}
  )

export const prefixSomeObjectKeys = (
  obj: ObjectWithAnyKeys,
  prefixedKeys: string[],
  prefix: string
): ObjectWithAnyKeys =>
  Object.keys(obj).reduce(
    (acc, oldKey) => ({
      ...acc,
      [`${prefixedKeys.includes(oldKey) ? prefix : ''}${oldKey}`]: obj[oldKey]
    }),
    {}
  )

export const NodeCacheInstance = new NodeCache({ stdTTL: 60 * 60 })

export const replaceIlpDev = (walletAddressUrl: string) => {
  return walletAddressUrl.replace('https://ilp.dev', env.OPEN_PAYMENTS_HOST)
}
