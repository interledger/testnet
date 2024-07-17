import {
  type ReactNode,
  ChangeEvent,
  forwardRef,
  useEffect,
  useId,
  useState
} from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { Label } from './Label'
import { FieldError } from './FieldError'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { cx } from 'class-variance-authority'
import { Spinner } from '@/components/icons/Spinner'

type InputProps = ComponentPropsWithoutRef<'input'> & {
  label?: string
  error?: string
  addOn?: ReactNode
  trailing?: ReactNode
  labelHint?: ReactNode
  isLoading?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      addOn,
      error,
      className,
      label,
      labelHint,
      isLoading = false,
      trailing,
      type,
      ...props
    },
    ref
  ) => {
    const id = useId()
    return (
      <div>
        <div className="mt-1">
          {label && (
            <Label htmlFor={id} hint={labelHint}>
              {label}{' '}
              {props.required ? (
                <span className="text-pink-neon">*</span>
              ) : null}
            </Label>
          )}
          <div className="mt-1 flex">
            {addOn ? (
              <span className="inline-flex items-center whitespace-pre rounded-l-md border border-r-0 border-green dark:border-pink-neon bg-black/5 dark:bg-black/30 p-2">
                {addOn}
              </span>
            ) : null}
            <div className="relative w-full">
              <input
                id={id}
                ref={ref}
                type={type ?? 'text'}
                className={cx(
                  'bg-transparent block w-full min-w-0 flex-1 rounded-md border border-green dark:border-pink-neon p-2 placeholder:text-black/70 dark:placeholder:text-white/70 disabled:bg-black/5 dark:disabled:bg-black/30 dark:focus:shadow-glow-button',
                  addOn ? 'rounded-l-none' : '',
                  trailing ? 'rounded-r-none' : '',
                  isLoading ? 'pr-10' : '',
                  className
                )}
                {...props}
              />
              {isLoading ? (
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <Spinner aria-hidden="true" />
                </span>
              ) : null}
            </div>
            {trailing ? (
              <span className="inline-flex items-center whitespace-pre rounded-r-md border border-l-0 border-green dark:border-pink-neon bg-black/5 dark:bg-black/30 p-2">
                {trailing}
              </span>
            ) : null}
          </div>
        </div>
        <FieldError error={error} />
      </div>
    )
  }
)

type DebouncedInputProps = Omit<InputProps, 'onChange'> & {
  value: string
  delay?: number
  onChange?: (value: string) => void | Promise<void>
}

export const DebouncedInput = ({
  value,
  onChange,
  delay = 1000,
  ...props
}: DebouncedInputProps) => {
  const [inputValue, setInputValue] = useState(value)
  const [debouncedValue, isLoading] = useDebounce(inputValue, delay)

  useEffect(() => {
    if (onChange) {
      onChange(debouncedValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue])

  const handleOnChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value.trim())
  }

  return (
    <Input
      value={inputValue}
      onChange={handleOnChange}
      isLoading={isLoading}
      {...props}
    />
  )
}

Input.displayName = 'Input'
