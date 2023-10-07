import { cx } from 'class-variance-authority'
import Backbutton from './icons/Backbutton'
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
      <div className="flex items-center">
        <Backbutton />
        <h2 className={cx('text-xl font-light', TYPES[type])}>Total balance</h2>
      </div>
      <h3 className={cx('mb-10 h-10 text-3xl font-semibold', TYPES[type])}>
        {balance}
      </h3>
    </div>
  )
}
