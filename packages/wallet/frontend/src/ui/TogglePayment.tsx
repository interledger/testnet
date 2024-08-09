import { Info } from '@/components/icons/Info'
import { PAYMENT_RECEIVE, PAYMENT_SEND } from '@/utils/constants'
import { Switch } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { useState, useEffect } from 'react'

const TYPES = {
  Send: { bg: 'bg-green dark:bg-pink-neon' },
  Receive: { bg: 'bg-pink-dark dark:bg-teal-neon' }
} as const

type ToggleTypes = keyof typeof TYPES

type ToggleProps = {
  type: ToggleTypes
  disabled?: boolean
  onChange?: (value: boolean) => void
}

// TODO: Look into replacing HeadlessUI with Radix
export const TogglePayment = ({
  type,
  disabled = false,
  onChange
}: ToggleProps) => {
  const value = type !== PAYMENT_SEND
  const [enabled, setEnabled] = useState(value)

  useEffect(() => {
    setEnabled(value)
  }, [value])

  const handleOnChange = () => {
    if (!disabled) {
      setEnabled(!enabled)
      onChange && onChange(!enabled)
    }
  }

  return (
    <Switch.Group>
      <div className="flex items-center justify-end">
        <Switch.Label
          className={cx(
            'pr-1',
            disabled
              ? 'text-black/50 dark:text-white/50'
              : 'cursor-pointer text-green-dark dark:text-pink-light'
          )}
        >
          {PAYMENT_SEND}
        </Switch.Label>
        <Switch
          id="sendReceive"
          checked={enabled || disabled}
          onChange={handleOnChange}
          className={cx(
            'relative inline-flex h-[1.4rem] w-[2.3rem] items-center rounded-full outline-none',
            disabled ? 'bg-black/40' : TYPES[type].bg
          )}
        >
          <span className="sr-only">Choose payment type</span>
          <span
            className={cx(
              'absolute left-[.15rem] top-[.15rem] inline-block h-[1.1rem] w-[1.1rem] transform rounded-full bg-white transition',
              enabled || disabled ? 'translate-x-[calc(100%-.2rem)]' : ''
            )}
          />
        </Switch>
        <Switch.Label
          className={cx(
            'pl-1',
            disabled
              ? 'text-black/50 dark:text-white/50'
              : 'cursor-pointer text-pink-dark dark:text-teal-light'
          )}
        >
          {PAYMENT_RECEIVE}
        </Switch.Label>
        <div className="has-tooltip">
          <Info className="ml-2 h-6 w-6 cursor-pointer text-green dark:text-pink-neon" />
          <span className="tooltip -ml-40 mr-2 min-w-36 max-w-80 rounded border border-green bg-white p-2 text-sm shadow-lg dark:border-pink-neon dark:bg-purple sm:-ml-10">
            You have to pay some fees in order to send payments.
            &apos;send&apos; means that the fees will be deducted from the
            amount in the input, and receiver will get the rest.
            &apos;receive&apos; means that the receiver will get the exact
            amount from the input and you will be paying a small fee in addition
            to that.
          </span>
        </div>
      </div>
    </Switch.Group>
  )
}
