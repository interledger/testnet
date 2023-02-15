import { cx } from 'class-variance-authority'

const TYPES = {
  Pink: 'text-brand-pink',
  Lilac: 'text-[#9D92D0]',
  Turqoise: 'text-brand-turqoise'
} as const

type HeaderTypes = keyof typeof TYPES

type TransferHeaderProps = {
  type: HeaderTypes
  balance: string
}

export const TransferHeader = ({ type, balance }: TransferHeaderProps) => {
  return (
    <div className="text-center">
      <h2 className={cx('text-xl font-light', TYPES[type])}>Total balance</h2>
      <h3 className={cx('mb-10 text-3xl font-semibold', TYPES[type])}>
        {balance}
      </h3>
    </div>
  )
}
