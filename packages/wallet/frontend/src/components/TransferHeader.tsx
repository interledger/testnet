import { cx } from 'class-variance-authority'

const TYPES = {
  pink: 'text-pink',
  violet: 'text-violet',
  turqoise: 'text-turqoise'
} as const

type HeaderTypes = keyof typeof TYPES

type TransferHeaderProps = {
  type: HeaderTypes
  balance: string
}

export const TransferHeader = ({ type, balance }: TransferHeaderProps) => {
  return (
    <div className="text-center">
      <div className="flex flex-col mb-6 items-center justify-center">
        <h2 className={cx('text-xl font-light', TYPES[type])}>Total Balance</h2>

        <h3 className={cx('h-10 text-3xl font-semibold', TYPES[type])}>
          {balance ? balance : '-.--'}
        </h3>
      </div>
    </div>
  )
}
