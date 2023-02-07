import { ReactNode } from 'react'
import { Listbox } from '@headlessui/react'

type Props = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  children: ReactNode
}

export const Select = (props: Props) => {
  return (
    <Listbox
      name="test"
      defaultValue={props.value}
      value={props.value}
      onChange={props.onChange}
      disabled={props.disabled}
    >
      {({ open }) => (
        <>
          <div>
            <Listbox.Button>
              <span className="">
                {props.value ? props.value : 'Please select an asset'}
              </span>
            </Listbox.Button>
            <Listbox.Options className="absolute">
              {open && props.children}
            </Listbox.Options>
          </div>
        </>
      )}
    </Listbox>
  )
}

type SelectOptionProps = {
  children: ReactNode
  value: string
}

export const SelectOption = (props: SelectOptionProps) => {
  return (
    <Listbox.Option key={props.value} value={props.value}>
      <span>{props.value}</span>
    </Listbox.Option>
  )
}

/*<Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {people.map((person, personIdx) => (
                <Listbox.Option
                  key={personIdx}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
                    }`
                  }
                  value={person}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {person.name}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                          CHECK
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>*/
