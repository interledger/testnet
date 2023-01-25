import { forwardRef } from 'react'
import type { ComponentProps } from 'react'

import { Label } from './Label'

type InputProps = Omit<ComponentProps<'input'>, 'ref' | 'className'> & {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, type, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col">
        {label && <Label htmlFor={props.name}>{label}</Label>}
        <input
          ref={ref}
          type={type ?? 'text'}
          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 shadow-sm transition-colors duration-150 ease-linear placeholder:font-extralight focus:border-gray-500 focus:outline-none focus:ring-0"
          {...props}
        />
      </div>
    )
  }
)

Input.displayName = 'Input'
