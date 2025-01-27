import { cx, CxOptions } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'
import { AssetOP } from '@wallet/shared'
import { QuoteResponse } from '@wallet/shared'
import { BASE_ASSET_SCALE } from './constants'

/**
 * `getObjectKeys` should be used only when we have additional knowledge.
 * If we know that a specific object doesn't have extra properties, the literal
 * type assertion can be safely used.
 */
export const getObjectKeys = Object.keys as <T extends object>(
  obj: T
) => Array<keyof T>

export type FormattedAmount = {
  amount: string
  symbol: string
}

export function cn(...inputs: CxOptions) {
  return twMerge(cx(inputs))
}

export const getCurrencySymbol = (assetCode: string): string => {
  return new Intl.NumberFormat('en-US', {
    currency: assetCode,
    style: 'currency',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  })
    .format(0)
    .replace(/0/g, '')
    .trim()
}

type FormatAmountArgs = AssetOP & {
  value: string
  displayScale?: number
}

export const formatAmount = (args: FormatAmountArgs): FormattedAmount => {
  const { value, displayScale = BASE_ASSET_SCALE, assetCode, assetScale } = args

  const scaledValue = Number(`${value}e-${assetScale}`)
  const flooredValue =
    Math.floor(scaledValue * 10 ** displayScale) / 10 ** displayScale

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: assetCode,
    maximumFractionDigits: displayScale,
    minimumFractionDigits: displayScale
  })

  const amount = formatter.format(flooredValue)
  const symbol = getCurrencySymbol(assetCode)

  return {
    amount,
    symbol
  }
}

type FormatDateArgs = {
  date: string
  time?: boolean
  month?: Intl.DateTimeFormatOptions['month']
}
export const formatDate = ({
  date,
  time = true,
  month = 'short'
}: FormatDateArgs): string => {
  return new Date(date).toLocaleDateString('default', {
    day: '2-digit',
    month,
    year: 'numeric',
    ...(time && { hour: '2-digit', minute: '2-digit' })
  })
}

export const formatDateNoTime = ({
  date,
  month = 'short'
}: FormatDateArgs): string => {
  return new Date(date).toLocaleDateString('default', {
    day: '2-digit',
    month,
    year: 'numeric'
  })
}

export const formatDateOnlyTime = ({
  date,
  time = true
}: FormatDateArgs): string => {
  return new Date(date).toLocaleTimeString('default', {
    ...(time && { hour: '2-digit', minute: '2-digit' })
  })
}

export const getFee = (quote: QuoteResponse): FormattedAmount => {
  if (quote.fee) {
    return formatAmount({
      assetCode: quote.fee.assetCode,
      assetScale: quote.fee.assetScale,
      value: quote.fee.value.toString()
    })
  }

  const fee =
    BigInt(quote.debitAmount.value) - BigInt(quote.receiveAmount.value)
  return formatAmount({
    assetCode: quote.debitAmount.assetCode,
    assetScale: quote.debitAmount.assetScale,
    value: fee.toString()
  })
}

const FILE_TYPE = {
  TEXT_PLAIN: 'text/plain'
} as const

type FileType = keyof typeof FILE_TYPE

type GenerateAndDownloadFileProps = {
  content: string
  fileName: string
  fileType: FileType
}

export const generateAndDownloadFile = ({
  content,
  fileName,
  fileType
}: GenerateAndDownloadFileProps): void => {
  const blob = new Blob([content], { type: FILE_TYPE[fileType] })
  const anchor = document.createElement('a')

  anchor.download = fileName
  anchor.href = URL.createObjectURL(blob)
  anchor.dataset.downloadurl = [fileType, anchor.download, anchor.href].join(
    ':'
  )
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(anchor.href)
}

export const replaceWalletAddressProtocol = (
  paymentPointer: string
): string => {
  return paymentPointer.indexOf('https://') !== -1
    ? paymentPointer.replace('https://', '$')
    : paymentPointer.indexOf('http://') !== -1
      ? paymentPointer.replace('http://', '$')
      : paymentPointer
}

export const replaceCardWalletAddressDomain = (
  paymentPointer: string,
  isCard?: boolean
): string => {
  if (isCard) {
    const url = new URL(paymentPointer.replace('$', 'https://'))
    return `$ilp.dev${url.pathname}`
  } else {
    return paymentPointer
  }
}

export function ab2str(buf: ArrayBuffer) {
  //@ts-expect-error: We know
  return String.fromCharCode.apply(null, new Uint8Array(buf))
}

export function parseJwt(token: string) {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      })
      .join('')
  )

  return JSON.parse(jsonPayload)
}

export function getCardTransactionType(type: number) {
  switch (type) {
    case 0:
      return 'Purchase'
    case 1:
      return 'ATM Withdrawal'
    case 6:
      return 'Card verification Inquiry'
    case 17:
      return 'Cash Advance'
    case 20:
      return 'Refund Credit Payment'
    case 30:
      return 'Balance Inquiry on ATM'
    case 91:
      return 'PIN Unblock'
    case 92:
      return 'PIN Change'
    case 101:
      return 'Preauthorization'
    case 102:
      return 'Preauthorization Incremental'
    case 103:
      return 'Preauthorization Completion'
    case 107:
      return 'Transfer to Account'
    case 108:
      return 'Transfer from Account'
    default:
      return null
  }
}
