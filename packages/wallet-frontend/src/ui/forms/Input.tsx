import { ChangeEvent, forwardRef, useEffect, useId, useState } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

import { Label } from './Label'
import { FieldError } from './FieldError'
import { useDebounce } from '@/lib/hooks/useDebounce'

type InputProps = Omit<ComponentPropsWithoutRef<'input'>, 'className'> & {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, type, error, ...props }, ref) => {
    const id = useId()
    return (
      <div>
        <div className="relative mt-1">
          <input
            id={id}
            ref={ref}
            type={type ?? 'text'}
            className="peer block w-full rounded-xl border border-turqoise pb-1 pt-4 placeholder-transparent shadow-md outline-none transition-colors duration-150 focus:border-green-3 focus:outline-none focus:ring-0 disabled:bg-black/5"
            {...props}
            placeholder={label}
          />
          {label && <Label htmlFor={id}>{label}</Label>}
        </div>
        <FieldError error={error} />
      </div>
    )
  }
)

type DebouncedInputProps = Omit<InputProps, 'onChange'> & {
  value: string
  delay?: number
  onChange?: (value: string) => void
}

export const DebouncedInput = ({
  value,
  onChange,
  delay = 500,
  ...props
}: DebouncedInputProps) => {
  const [inputValue, setInputValue] = useState(value)
  const [debouncedValue] = useDebounce(inputValue, delay)

  useEffect(() => {
    if (onChange) {
      onChange(debouncedValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue])

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value.trim())
  }

  return <Input value={inputValue} onChange={handleOnChange} {...props} />
}

Input.displayName = 'Input'
