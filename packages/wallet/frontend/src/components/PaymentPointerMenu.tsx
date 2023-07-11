import { Menu, Transition } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { Fragment } from 'react'
import { EllipsisV } from './icons/Ellipsis'

export const PaymentPointerMenu = () => {
  return (
    <Menu as="div" className="relative inline-block">
      {({ open }) => {
        if (typeof window !== 'undefined') {
          document.body.classList.toggle('overflow-hidden', open)
          document.body.classList.toggle('md:overflow-auto', open)
        }
        return (
          <>
            <div>
              <Menu.Button className="flex items-center rounded-full !bg-transparent text-green-5 hover:text-green-6 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100">
                <span className="sr-only">Open options</span>
                <EllipsisV className="h-5 w-5" aria-hidden="true" />
              </Menu.Button>
            </div>
            <div
              className={cx(
                'inset-0 z-20 overflow-hidden bg-black/10',
                open ? 'fixed md:hidden' : 'hidden'
              )}
            />
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                className={`
              fixed inset-x-0 bottom-0 z-30 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-green-5 focus:outline-none 
              md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:mt-2 md:w-56
              lg:bottom-auto lg:left-full lg:top-0 lg:ml-3 lg:mt-0 lg:origin-top-left
              `}
              >
                <div className="py-1 text-green">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        aria-label="test"
                        className={cx(
                          active && 'bg-green-4',
                          'block w-full px-4 py-2 text-left'
                        )}
                      >
                        Account settings
                      </button>
                    )}
                  </Menu.Item>
                  <form method="POST" action="#">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          type="submit"
                          className={cx(
                            active
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700',
                            'block w-full px-4 py-2 text-left text-sm'
                          )}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </form>
                </div>
              </Menu.Items>
            </Transition>
          </>
        )
      }}
    </Menu>
  )
}
