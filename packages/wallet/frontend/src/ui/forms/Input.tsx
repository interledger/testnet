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
              {props.required ? <span className="text-red-500">*</span> : null}
            </Label>
          )}
          <div className="mt-1 flex rounded-md shadow-sm">
            {addOn ? (
              <span className="inline-flex items-center whitespace-pre rounded-l-md border border-r-0 border-turqoise bg-gray-50 px-3 text-gray-600">
                {addOn}
              </span>
            ) : null}
            <div className="relative w-full">
              <input
                id={id}
                ref={ref}
                type={type ?? 'text'}
                className={cx(
                  'block w-full min-w-0 flex-1 rounded-md border border-turqoise py-1.5 placeholder:text-black/50 focus:border-green-3 focus:outline-none focus:ring-0 disabled:bg-gray-50 disabled:text-gray-600',
                  addOn ? 'rounded-l-none' : '',
                  trailing && 'rounded-r-none',
                  isLoading && 'pr-10',
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
              <span className="inline-flex items-center whitespace-pre rounded-r-md border border-l-0 border-turqoise bg-gray-50 px-3 text-gray-600">
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
