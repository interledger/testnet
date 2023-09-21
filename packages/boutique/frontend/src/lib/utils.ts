import { type CxOptions, cx } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: CxOptions) {
  return twMerge(cx(inputs))
}

export function formatPrice(price: number): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  })

  return formatter.format(price)
}

export const getObjectKeys = Object.keys as <T extends object>(
  obj: T
) => Array<keyof T>
