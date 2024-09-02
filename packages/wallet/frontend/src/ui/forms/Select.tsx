import { Play } from '@/components/icons/Play'
import { cx } from 'class-variance-authority'
import { type ReactNode, useId } from 'react'
import ReactSelect, { DropdownIndicatorProps, components } from 'react-select'
import type { GroupBase, InputProps, Props } from 'react-select'
import { FieldError } from './FieldError'
import { Label } from './Label'

declare module 'react-select/dist/declarations/src/Select' {
  export interface Props<
    Option,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    IsMulti extends boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Group extends GroupBase<Option>
  > {
    error?: string
    label?: string
    labelHint?: ReactNode
  }
}

const Input = <
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>({
  inputClassName,
  ...props
}: InputProps<Option, IsMulti, Group>) => {
  return (
    <components.Input
      inputClassName={cx(
        'focus:ring-0 focus:ring-offset-0 border m-0.5 py-0.5 border-green dark:border-pink-neon',
        inputClassName
      )}
      {...props}
    />
  )
}

const DropdownIndicator = <
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>(
  props: DropdownIndicatorProps<Option, IsMulti, Group>
) => {
  return (
    <components.DropdownIndicator {...props}>
      <Play className="h-4 w-4 rotate-90 text-green dark:text-pink-neon" />
    </components.DropdownIndicator>
  )
}

export type SelectOption = {
  value: string
  label: string
}

export type SelectProps<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
> = Props<Option, IsMulti, Group>

export const Select = <
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>({
  className,
  error,
  label,
  labelHint,
  ...props
}: SelectProps<Option, IsMulti, Group>) => {
  const id = useId()
  return (
    <div className="space-y-1">
      {label && (
        <Label htmlFor={id} hint={labelHint}>
          {label}{' '}
          {props.required ? (
            <span className="text-pink-dark dark:text-pink-neon">*</span>
          ) : null}
        </Label>
      )}
      <ReactSelect
        unstyled
        components={{
          ...components,
          IndicatorSeparator: () => null,
          Input,
          DropdownIndicator
        }}
        classNames={{
          control: ({ isDisabled, isFocused }) =>
            cx(
              'rounded-md border bg-white dark:bg-purple',
              isDisabled ? 'bg-gray-50 text-gray-600' : 'bg-white',
              isFocused
                ? 'border-black dark:shadow-glow-link dark:border-white'
                : 'border-green dark:border-pink-neon'
            ),
          dropdownIndicator: () => 'p-1',
          input: () => 'disabled:text-gray-600',
          menu: () =>
            'bg-white dark:bg-purple border dark:border-pink-light rounded-md my-1 shadow-md overflow-hidden',
          menuList: () => '',
          noOptionsMessage: () => 'text-gray-600 py-2 px-3',
          option: ({ isFocused, isSelected }) =>
            cx(
              'py-2 px-3',
              isSelected
                ? 'bg-green-light dark:bg-purple-dark dark:text-white'
                : isFocused
                  ? 'bg-green-light dark:bg-purple-dark dark:text-white'
                  : ''
            ),
          singleValue: () => 'mx-0.5',
          valueContainer: () => 'p-2',
          placeholder: () => 'mx-0.5 text-black/50 dark:text-white/70'
        }}
        className={className}
        id={id}
        instanceId={id}
        {...props}
      />
      <FieldError error={error} />
    </div>
  )
}
