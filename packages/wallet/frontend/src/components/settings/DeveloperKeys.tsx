import { Account } from '@/lib/api/account'
import { Disclosure, Transition } from '@headlessui/react'
import { Chevron } from '../icons/Chevron'
import { PaymentPointer, paymentPointerService } from '@/lib/api/paymentPointer'
import { cx } from 'class-variance-authority'
import { CopyButton } from '@/ui/CopyButton'
import { Button } from '@/ui/Button'
import { ReactNode, createContext, useContext, useState } from 'react'
import { useDialog } from '@/lib/hooks/useDialog'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { useRouter } from 'next/router'
import { generateAndDownloadFile } from '@/utils/helpers'
import { ConfirmationDialog } from '../dialogs/ConfirmationDialog'

type PaymentPointerContextType = {
  paymentPointer: PaymentPointer
  paymentPointersCount: number
  paymentPointerIdx: number
}

const PaymentPointerContext = createContext<
  PaymentPointerContextType | undefined
>(undefined)

type PaymentPointerProviderProps = PaymentPointerContextType & {
  children: ReactNode
}

export const usePaymentPointerContext = (): PaymentPointerContextType => {
  const context = useContext(PaymentPointerContext)
  if (!context) {
    throw new Error(
      'usePaymentPointerContext must be used within an PaymentPointerProvider'
    )
  }
  return context
}

export const PaymentPointerProvider = ({
  children,
  paymentPointer,
  paymentPointerIdx,
  paymentPointersCount
}: PaymentPointerProviderProps) => {
  return (
    <PaymentPointerContext.Provider
      value={{ paymentPointer, paymentPointersCount, paymentPointerIdx }}
    >
      {children}
    </PaymentPointerContext.Provider>
  )
}

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
      <Disclosure.Button className="flex w-full justify-between rounded-md bg-gradient-primary-dark p-2 shadow-md">
        <span className="font-semibold leading-7 text-white">
          Account: {name}
        </span>
        <span className="ml-6 flex items-center">
          <Chevron
            className="h-6 w-6 text-white transition-transform duration-300"
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
      enterTo="transform max-h-screen"
      leave="transition-all ease-in-out duration-300"
      leaveFrom="transform max-h-screen"
      leaveTo="transform max-h-0"
    >
      <Disclosure.Panel as="dd" className="mt-6 px-2">
        <ul role="list" className="space-y-6">
          {paymentPointers.map((paymentPointer, paymentPointerIdx) => (
            <PaymentPointerProvider
              key={paymentPointer.id}
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
    <li key={paymentPointer.url} className="relative flex gap-x-1 text-green">
      <PaymentPointerKeyStatus />
      <div className="max-h flex-auto space-y-2 leading-6">
        <p className="font-semibold">{paymentPointer.url}</p>
        <hr />
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

  return (
    <div className="flex flex-col space-y-4">
      {paymentPointer.keyIds ? (
        <>
          <div className="flex flex-col justify-between">
            <p className="font-normal">Key ID</p>
            <div className="flex items-center justify-between">
              <span className="font-extralight">
                {paymentPointer.keyIds.id}
              </span>
              <CopyButton
                aria-label="copy key id"
                className="h-10 w-10"
                value={paymentPointer.keyIds.id}
              />
            </div>
          </div>
          <div>
            <p className="font-normal">Created on</p>
            <span className="font-extralight leading-10">
              {paymentPointer.keyIds.createdOn}
            </span>
          </div>

          <PublicKeyContainer publicKey={paymentPointer.keyIds.publicKey} />
        </>
      ) : null}
      <PaymentPointerCTA />
    </div>
  )
}

const PaymentPointerCTA = () => {
  const { paymentPointer } = usePaymentPointerContext()
  const [openDialog, closeDialog] = useDialog()
  const router = useRouter()

  async function revokePublicAndPrivateKeys() {
    const response = await paymentPointerService.revokeKey({
      accountId: paymentPointer.accountId,
      paymentPointerId: paymentPointer.id
    })

    if (!response.success) {
      openDialog(
        <ErrorDialog
          onClose={() => {
            closeDialog()
          }}
          content={response.message}
        />
      )
      return
    }

    openDialog(
      <SuccessDialog
        title="Success"
        onClose={() => {
          closeDialog()
          router.replace(router.asPath)
        }}
        content={response.message}
      />
    )
  }

  async function generatePublicAndPrivateKeys() {
    const response = await paymentPointerService.generateKey({
      accountId: paymentPointer.accountId,
      paymentPointerId: paymentPointer.id
    })

    if (!response.success) {
      openDialog(
        <ErrorDialog onClose={() => closeDialog()} content={response.message} />
      )
      return
    }

    if (response.data) {
      const { privateKey } = response.data

      generateAndDownloadFile({
        content: privateKey,
        fileName: 'private.key',
        fileType: 'TEXT_PLAIN'
      })

      openDialog(
        <SuccessDialog
          title="Success"
          content={'The private key was automatically saved on your device.'}
          onClose={() => {
            closeDialog()
            router.replace(router.asPath)
          }}
        />
      )
    }
  }

  return (
    <div className="pt-4">
      {paymentPointer.keyIds ? (
        <Button
          intent="secondary"
          aria-label="generate keys"
          onClick={() =>
            openDialog(
              <ConfirmationDialog
                confirmText="Revoke payment pointer key"
                onConfirm={() => revokePublicAndPrivateKeys()}
                onClose={closeDialog}
              />
            )
          }
        >
          Revoke public & private key
        </Button>
      ) : (
        <Button
          aria-label="generate keys"
          onClick={generatePublicAndPrivateKeys}
        >
          Generate public & private key
        </Button>
      )}
    </div>
  )
}

type PublicKeyContainerProps = {
  publicKey: string
}

const PublicKeyContainer = ({ publicKey }: PublicKeyContainerProps) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="flex flex-col justify-between space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-normal">Public key</p>
        <Button
          size="sm"
          intent="outline"
          aria-label="show or hide public key"
          onClick={() => setIsVisible((prev) => !prev)}
        >
          {isVisible ? 'Hide' : 'Show'}
        </Button>
      </div>
      {isVisible ? (
        <div className="rounded-lg shadow-sm ring-1 ring-inset ring-gray-300">
          <textarea
            readOnly
            disabled
            rows={4}
            className="block w-full resize-none border-0 bg-transparent py-1.5 text-sm text-green disabled:bg-black/10"
            value={publicKey}
          />
        </div>
      ) : null}
    </div>
  )
}
