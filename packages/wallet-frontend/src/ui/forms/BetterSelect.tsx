import { useId } from 'react'
import ReactSelect, { components } from 'react-select'
import type { GroupBase, InputProps, Props } from 'react-select'

const Input = <
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
>(
  props: InputProps<Option, IsMulti, Group>
) => {
  return <components.Input {...props} />
}

export type SelectProps<
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
> = Props<Option, IsMulti, Group>

export const SelectTest = <
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>({
  className,
  ...props
}: SelectProps<Option, IsMulti, Group>) => {
  const id = useId()
  return (
    <ReactSelect
      theme={(theme) => ({
        ...theme
      })}
      components={{
        ...components,
        IndicatorSeparator: () => null,
        Input
      }}
      className={className}
      id={id}
      instanceId={id}
      {...props}
    />
  )
}
