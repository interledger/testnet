import { bcrypt } from 'hash-wasm'
import { randomBytes } from 'crypto'

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

export const transformBalance = (value: number, scale: number): bigint => {
  return BigInt(Math.floor(value * 10 ** scale))
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
