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

type FormatAmountArgs = {
  value: string
  assetCode: string
  assetScale: number
}

export const formatAmount = (args: FormatAmountArgs): FormattedAmount => {
  const { value, assetCode, assetScale } = args
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: assetCode,
    maximumFractionDigits: assetScale,
    minimumFractionDigits: assetScale
  })

  const amount = formatter.format(Number(`${value}e-${assetScale}`))
  const symbol = getCurrencySymbol(assetCode)

  return {
    amount,
    symbol
  }
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('default', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getFee = (
  send: FormatAmountArgs,
  receive: FormatAmountArgs
): FormattedAmount => {
  const fee = BigInt(send.value) - BigInt(receive.value)
  return formatAmount({
    assetCode: send.assetCode,
    assetScale: send.assetScale,
    value: fee.toString()
  })
}

const FILE_TYPE = {
  TEXT_PLAIN: 'text/plain'
} as const

type FileType = keyof typeof FILE_TYPE

type GenerateAndDownloadFileProps = {
  content: string
  filename: string
  fileType: FileType
}

export const generateAndDownloadFile = ({
  content,
  filename,
  fileType
}: GenerateAndDownloadFileProps): void => {
  const blob = new Blob([content], { type: FILE_TYPE[fileType] })
  const anchor = document.createElement('a')

  anchor.download = filename
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
