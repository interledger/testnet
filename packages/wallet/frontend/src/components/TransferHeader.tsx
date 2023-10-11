import { cx } from 'class-variance-authority'
import Backbutton from './BackButton'
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
      <div className="relative mb-16 mt-7 flex items-center">
        <Backbutton />
        <div className="absolute left-[50%] -translate-x-1/2">
          <h2 className={cx('text-xl font-light', TYPES[type])}>
            Total balance
          </h2>
          {balance && (
            <h3 className={cx('h-10 text-3xl font-semibold', TYPES[type])}>
              {balance}
            </h3>
          )}
        </div>
      </div>
    </div>
  )
}
