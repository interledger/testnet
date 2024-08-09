import { cx } from 'class-variance-authority'

const TYPES = {
  pink: 'text-pink-dark dark:text-pink-neon',
  green: 'text-green dark:text-green-neon'
} as const

type HeaderTypes = keyof typeof TYPES

type TransferHeaderProps = {
  type: HeaderTypes
  balance: string
}

export const TransferHeader = ({ type, balance }: TransferHeaderProps) => {
  return (
    <div className="text-center">
      <div className="mb-6 flex flex-col items-center justify-center">
        <h2 className={cx('text-xl font-light', TYPES[type])}>Total Balance</h2>

        <h3 className={cx('h-10 text-3xl font-semibold', TYPES[type])}>
          {balance ? balance : '-.--'}
        </h3>
      </div>
    </div>
  )
}
