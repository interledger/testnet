import { cx, CxOptions } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'
import { AssetOP } from '@wallet/shared'
import { QuoteResponse } from '@wallet/shared'
import { WalletAddressResponse } from '@wallet/shared'

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
  const { value, displayScale = 9, assetCode, assetScale } = args

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

export const getFee = (quote: QuoteResponse): FormattedAmount => {
  if (quote.fee) {
    return formatAmount({
      assetCode: quote.fee.assetCode,
      assetScale: quote.fee.assetScale,
      displayScale: 2,
      value: quote.fee.value
    })
  }

  const fee =
    BigInt(quote.debitAmount.value) - BigInt(quote.receiveAmount.value)

  return formatAmount({
    assetCode: quote.debitAmount.assetCode,
    assetScale: quote.debitAmount.assetScale,
    displayScale: 2,
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

export const calculateBalance = (
  walletAddresses?: WalletAddressResponse[]
): number => {
  if (!walletAddresses || !Array.isArray(walletAddresses)) {
    return 0
  }

  return walletAddresses.reduce((acc, pp) => {
    const incoming = Number(pp.incomingBalance) || 0
    const outgoing = Number(pp.outgoingBalance) || 0
    console.log('Incoming - outgoing: ', acc + incoming - outgoing)
    return acc + (incoming - outgoing)
  }, 0)
}
