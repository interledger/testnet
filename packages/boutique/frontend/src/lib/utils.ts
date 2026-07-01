import { type CxOptions, cx } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'
import { CURRENCY } from '@/lib/constants'

export function cn(...inputs: CxOptions) {
  return twMerge(cx(inputs))
}

export function formatPrice(price: number): string {
  let currency = CURRENCY
  try {
    new Intl.NumberFormat('en-US', { style: 'currency', currency })
  } catch {
    currency = 'USD'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(price)
}

export const getObjectKeys = Object.keys as <T extends object>(
  obj: T
) => Array<keyof T>
