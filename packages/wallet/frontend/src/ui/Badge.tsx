import { cva, cx, type VariantProps } from 'class-variance-authority'

const badgeStyles = cva(
  ['inline-flex items-center justify-center rounded-md text-sm'],
  {
    variants: {
      intent: {
        green: [
          'border border-green-dark text-green-dark dark:border-teal-neon dark:text-teal-neon'
        ],
        orange: [
          'border border-orange-dark text-orange-dark dark:border-yellow-neon dark:text-yellow-neon'
        ],
        pink: [
          'border border-pink-dark text-pink-dark dark:border-pink-light dark:text-pink-light'
        ],
        violet: [
          'border border-purple-light text-pink-light dark:border-pink-neon dark:text-pink-neon'
        ]
      },
      size: {
        fixed: ['w-10'],
        md: ['px-2 py-0.5 text-xs font-semibold uppercase'],
        lg: ['px-2.5 py-0.5 text-sm font-semibold uppercase']
      }
    },
    defaultVariants: {
      intent: 'green'
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
    case 'APPROVED':
    case 'FINALIZED':
    case 'ISSUED':
      return 'green'
    case 'FAILED':
    case 'EXPIRED':
    case 'REJECTED':
      return 'pink'
    case 'PENDING':
    case 'PROCESSING':
      return 'orange'
    case 'FUNDING':
    case 'SENDING':
    case 'REVOKED':
      return 'violet'
    default:
      return 'green'
  }
}
