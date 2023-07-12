import { Account } from '@/lib/api/account'
import { Disclosure, Transition } from '@headlessui/react'
import { Chevron } from '../../icons/Chevron'
import { PaymentPointer } from '@/lib/api/paymentPointer'
import { cx } from 'class-variance-authority'
import { Button } from '@/ui/Button'
import { CopyButton } from '@/ui/CopyButton'
import { PaymentPointerProvider, usePaymentPointerContext } from './context'

type DeveloperKeysProps = {
  accounts: Account[]
}

export const DeveloperKeys = ({ accounts }: DeveloperKeysProps) => {
  return (
    <dl className="space-y-6 divide-y divide-green/10">
      {accounts.map((account) => (
        <Disclosure as="div" key={account.name} className="pt-6">
          {({ open }) => (
            <>
              <AccountHeader name={account.name} isOpen={open} />
              <AccountPanel paymentPointers={account.paymentPointers} />
            </>
          )}
        </Disclosure>
      ))}
    </dl>
  )
}

type AccountHeaderProps = {
  name: string
  isOpen: boolean
}

const AccountHeader = ({ name, isOpen }: AccountHeaderProps) => {
  return (
    <dt>
      <Disclosure.Button className="flex w-full justify-between rounded-md bg-green-4 p-2 shadow-md">
        <span className="font-semibold leading-7 text-green">{name}</span>
        <span className="ml-6 flex items-center">
          <Chevron
            className="h-6 w-6 transition-transform duration-300"
            direction={isOpen ? 'down' : 'left'}
          />
        </span>
      </Disclosure.Button>
    </dt>
  )
}

type AccountPanelProps = {
  paymentPointers: PaymentPointer[]
}

const AccountPanel = ({ paymentPointers }: AccountPanelProps) => {
  return (
    <Transition
      className="overflow-hidden"
      enter="transition-all ease-in-out duration-300"
      enterFrom="transform max-h-0"
      enterTo="transform max-h-96"
      leave="transition-all ease-in-out duration-300"
      leaveFrom="transform max-h-96"
      leaveTo="transform max-h-0"
    >
      <Disclosure.Panel as="dd" className="mt-6 px-2">
        <ul role="list" className="space-y-6">
          {paymentPointers.map((paymentPointer, paymentPointerIdx) => (
            <PaymentPointerProvider
              paymentPointer={paymentPointer}
              paymentPointersCount={paymentPointers.length}
              paymentPointerIdx={paymentPointerIdx}
            >
              <PaymentPointer />
            </PaymentPointerProvider>
          ))}
        </ul>
      </Disclosure.Panel>
    </Transition>
  )
}

const PaymentPointer = () => {
  const { paymentPointer } = usePaymentPointerContext()
  return (
    <li key={paymentPointer.url} className="relative flex gap-x-4">
      <PaymentPointerKeyStatus />
      <div className="flex-auto space-y-2 py-0.5 leading-5">
        <p className="font-semibold text-gray-900">{paymentPointer.url}</p>
        <div className="flex-none py-0.5 text-sm leading-5">
          <PaymentPointerKeyInfo />
        </div>
      </div>
    </li>
  )
}

const PaymentPointerKeyStatus = () => {
  const { paymentPointer, paymentPointerIdx, paymentPointersCount } =
    usePaymentPointerContext()
  return (
    <>
      <div
        className={cx(
          paymentPointerIdx === paymentPointersCount - 1 ? 'h-6' : '-bottom-6',
          'absolute left-0 top-0 flex w-6 justify-center'
        )}
      >
        <div className="w-px bg-gray-200" />
      </div>

      <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
        <div
          className={cx(
            'h-1.5 w-1.5 rounded-full ring-1',
            paymentPointer.keyIds
              ? 'bg-green-4 ring-green-3'
              : 'bg-gray-100 ring-gray-300'
          )}
        />
      </div>
    </>
  )
}

const PaymentPointerKeyInfo = () => {
  const { paymentPointer } = usePaymentPointerContext()
  return <>Key ID: {paymentPointer.keyIds}</>
}

// ;<div className="flex-auto space-y-2 py-0.5 leading-5 text-gray-500">
//   <p className="font-medium text-gray-900">{paymentPointer.url}</p>
//   <div className="flex-none py-0.5 text-sm leading-5 text-gray-500">
//     {paymentPointer.keyIds ? (
//       <div className="flex space-x-2">
//         <Button size="sm" aria-label="revoke key">
//           Revoke key
//         </Button>
//         <CopyButton
//           size="sm"
//           ctaText="Copy"
//           afterCtaText="Copied"
//           value={paymentPointer.keyIds}
//           aria-label="copy key id"
//           className="w-20"
//         />
//       </div>
//     ) : (
//       <Button size="sm" aria-label="generate key" className="w-20">
//         Generate
//       </Button>
//     )}
//   </div>
// </div>
