import { Info } from '@/components/icons/Info'
import { PAYMENT_RECEIVE, PAYMENT_SEND } from '@/utils/constants'
import { Field, Label, Switch } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { useState, useEffect } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/ui/Tooltip'

const TYPES = {
  send: { bg: 'bg-green dark:bg-pink-neon' },
  receive: { bg: 'bg-pink-dark dark:bg-teal-neon' }
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
    <Field>
      <div className="flex items-center justify-end">
        <Label
          className={cx(
            'pr-1',
            disabled
              ? 'text-black/50 dark:text-white/50'
              : 'cursor-pointer text-green-dark dark:text-pink-light'
          )}
        >
          {PAYMENT_SEND}
        </Label>
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
        <Label
          className={cx(
            'pl-1',
            disabled
              ? 'text-black/50 dark:text-white/50'
              : 'cursor-pointer text-pink-dark dark:text-teal-light'
          )}
        >
          {PAYMENT_RECEIVE}
        </Label>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger>
              <Info className="ml-2 h-6 w-6 cursor-pointer text-green dark:text-pink-neon" />
            </TooltipTrigger>
            <TooltipContent
              className="max-w-80"
              side="right"
              onPointerDownOutside={(e) => e.preventDefault()}
            >
              You have to pay some fees in order to send payments. <b>Send</b>{' '}
              means that the fees will be deducted from the amount in the input,
              and receiver will get the rest. <b>Receive</b> means that the
              receiver will get the exact amount from the input and you will be
              paying a small fee in addition to that.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Field>
  )
}
