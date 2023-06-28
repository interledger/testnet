import { cva, cx, type VariantProps } from 'class-variance-authority'

const badgeStyles = cva(
  ['inline-flex items-center justify-center rounded-md text-sm'],
  {
    variants: {
      intent: {
        primary: ['bg-gradient-to-r from-green-5 to-green-6 text-white'],
        green: ['bg-green-5 text-green-3'],
        orange: ['bg-orange-1 text-orange-2'],
        pink: ['bg-pink-1 text-pink'],
        violet: ['bg-violet-1 text-violet']
      },
      size: {
        fixed: ['w-10'],
        md: ['px-2 py-0.5 text-xs font-semibold uppercase'],
        lg: ['px-2.5 py-0.5 text-sm font-semibold uppercase']
      }
    },
    defaultVariants: {
      intent: 'primary'
    }
  }
)

type BadgeProps = VariantProps<typeof badgeStyles> & {
  text: string
  className?: string
}

export const Badge = ({ text, className, intent, size }: BadgeProps) => {
  return (
    <span className={cx(className, badgeStyles({ intent, size }))}>{text}</span>
  )
}

export const getStatusBadgeIntent = (
  status: string
): VariantProps<typeof badgeStyles>['intent'] => {
  switch (status) {
    case 'COMPLETED':
    case 'GRANTED':
    case 'CREATE':
    case 'INCOMING_PAYMENT':
      return 'green'
    case 'FAILED':
    case 'EXPIRED':
    case 'REJECTED':
    case 'REVOKED':
    case 'READ':
    case 'OUTGOING_PAYMENT':
      return 'pink'
    case 'PENDING':
    case 'PROCESSING':
    case 'LIST':
      return 'orange'
    case 'FUNDING':
    case 'SENDING':
    case 'COMPLETE':
    case 'QUOTE':
      return 'violet'
    default:
      return 'primary'
  }
}
