import { Play } from '@/components/icons/Play'
import { Listbox } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { useEffect, useState } from 'react'
import type {
  FieldPath,
  FieldPathValue,
  FieldValues,
  UseFormSetValue
} from 'react-hook-form'
import { FieldError } from './FieldError'

type SelectOption = {
  value: string
  name: string
}

type SelectProps<T extends FieldValues> = {
  name: FieldPath<T>
  setValue: UseFormSetValue<T>
  defaultValue?: SelectOption
  options: SelectOption[]
  label?: string
  placeholder?: string
  error?: string
}

export const Select = <T extends FieldValues>({
  name,
  setValue,
  defaultValue,
  options,
  label,
  placeholder,
  error
}: SelectProps<T>) => {
  const [selected, setSelected] = useState<SelectOption | null>(
    defaultValue ?? null
  )

  /**
   * TODO(@raducristianpopa): There might be a better way to do this
   * https://react-hook-form.com/ts#UseControllerProps
   */
  useEffect(() => {
    if (selected)
      setValue(name, selected.value as FieldPathValue<T, FieldPath<T>>)
  }, [selected, name, setValue])

  return (
    <div>
      <Listbox name={name} value={selected} onChange={setSelected}>
        {({ open }) => (
          <div className="relative">
            <Listbox.Button className="peer relative block w-full rounded-xl border border-turqoise bg-white px-3 pt-4 pb-1 text-left shadow-md transition-colors duration-150 focus:border-green-3 focus:outline-none focus:ring-0">
              <span className="block truncate">
                {selected
                  ? selected.name
                  : placeholder ?? 'Please select an option'}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <Play
                  className={cx(
                    'h-4 w-4 transition-transform',
                    open ? 'rotate-90' : 'rotate-180'
                  )}
                />
              </span>
            </Listbox.Button>
            <Listbox.Label
              className={cx(
                'absolute -top-1 left-3 block py-1 text-sm font-light transition-colors',
                open ? 'text-green-3' : 'text-turqoise'
              )}
            >
              {label}
            </Listbox.Label>

            <Listbox.Options className="absolute z-10 mt-3 max-h-32 w-full overflow-y-auto overscroll-contain rounded-md border border-green-3 bg-white">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ selected }) =>
                    cx(
                      'relative flex items-center p-2 first:rounded-t-md last:rounded-b-md',
                      selected
                        ? 'bg-green-3 text-white'
                        : 'text-green-3 hover:bg-green-3/50 hover:text-white'
                    )
                  }
                  value={option}
                >
                  <span className="block truncate">{option.name}</span>
                </Listbox.Option>
              ))}
            </Listbox.Options>
            <FieldError error={error} />
          </div>
        )}
      </Listbox>
    </div>
  )
}
