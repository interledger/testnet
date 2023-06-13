import { PAYMENT_RECEIVE, PAYMENT_SEND } from '@/utils/constants'
import { Switch } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { useState, useEffect } from 'react'

const TYPES = {
  send: { text: 'text-pink', bg: 'bg-pink' },
  receive: { text: 'text-violet', bg: 'bg-violet' }
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
            disabled ? 'text-black/40' : `cursor-pointer text-pink`
          )}
        >
          {PAYMENT_SEND}
        </Switch.Label>
        <Switch
          checked={enabled || disabled}
          onChange={handleOnChange}
          className={cx(
            'relative inline-flex h-5 w-10 items-center rounded-full outline-none',
            disabled ? 'bg-black/40' : TYPES[type].bg
          )}
        >
          <span className="sr-only">Choose payment type</span>
          <span
            className={cx(
              'inline-block h-4 w-4 transform rounded-full bg-white transition',
              enabled || disabled ? 'translate-x-5' : 'translate-x-1'
            )}
          />
        </Switch>
        <Switch.Label
          className={cx(
            'pl-1',
            disabled ? 'text-black/40' : 'cursor-pointer text-violet'
          )}
        >
          {PAYMENT_RECEIVE}
        </Switch.Label>
      </div>
    </Switch.Group>
  )
}
