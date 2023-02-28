import { Switch } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { useState } from 'react'

const TYPES = {
  pink: { text: 'text-pink', bg: 'bg-pink' },
  violet: { text: 'text-violet', bg: 'bg-violet' }
} as const

type ToggleTypes = keyof typeof TYPES

type ToggleProps = {
  type: ToggleTypes
  disabled?: boolean
}

export const TogglePayment = ({ type, disabled }: ToggleProps) => {
  const [enabled, setEnabled] = useState(false)

  const handleOnChange = () => {
    setEnabled(!disabled && !enabled)
  }

  return (
    <Switch.Group>
      <div className="flex items-center justify-end">
        <Switch.Label
          className={cx(
            'pr-1',
            disabled ? 'text-black/40' : `cursor-pointer ${TYPES[type].text}`
          )}
        >
          sent
        </Switch.Label>
        <Switch
          checked={enabled || disabled}
          onChange={handleOnChange}
          className={cx(
            'relative inline-flex h-5 w-10 items-center rounded-full outline-none',
            disabled ? 'bg-black/40' : enabled ? 'bg-turqoise' : TYPES[type].bg
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
            disabled ? 'text-black/40' : 'cursor-pointer text-turqoise'
          )}
        >
          received
        </Switch.Label>
      </div>
    </Switch.Group>
  )
}
