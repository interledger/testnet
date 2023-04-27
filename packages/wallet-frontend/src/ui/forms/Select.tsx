import { Play } from '@/components/icons/Play'
import { cx } from 'class-variance-authority'
import { useId } from 'react'
import ReactSelect, { DropdownIndicatorProps, components } from 'react-select'
import type { GroupBase, InputProps, Props } from 'react-select'
import { FieldError } from './FieldError'

declare module 'react-select/dist/declarations/src/Select' {
  export interface Props<
    Option,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    IsMulti extends boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Group extends GroupBase<Option>
  > {
    error?: string
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
        'focus:ring-0 focus:ring-offset-0 border border-turqoise text-black',
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
      <Play className="h-4 w-4 rotate-90" />
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
  ...props
}: SelectProps<Option, IsMulti, Group>) => {
  const id = useId()
  return (
    <>
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
              'rounded-xl shadow-md border',
              isDisabled ? 'bg-black/5' : 'bg-white',
              isFocused ? 'border-green-3' : 'border-turqoise'
            ),
          dropdownIndicator: () => 'p-2',
          input: () => 'm-0.5 py-0.5 text-neutral-800',
          menu: () => 'bg-white border border-green-3 rounded my-1 shadow-md',
          menuList: () => '',
          noOptionsMessage: () => 'text-neutral-400 py-2 px-3',
          option: ({ isFocused, isSelected }) =>
            cx(
              'py-2 px-3',
              isSelected
                ? 'bg-green-3 text-white'
                : isFocused
                ? 'bg-green-3/50 text-white'
                : ''
            ),
          singleValue: () => 'mx-0.5',
          valueContainer: () => 'py-0.5 px-2'
        }}
        className={className}
        id={id}
        instanceId={id}
        {...props}
      />
      <FieldError error={error} />
    </>
  )
}
