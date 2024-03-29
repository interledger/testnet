import { Account } from '@/lib/api/account'
import { Disclosure, Transition } from '@headlessui/react'
import { Chevron } from '../icons/Chevron'
import {
  WalletAddress,
  WalletAddressKey,
  walletAddressService
} from '@/lib/api/walletAddress'
import { cx } from 'class-variance-authority'
import { CopyButton } from '@/ui/CopyButton'
import { Button } from '@/ui/Button'
import { ReactNode, createContext, useContext, useState } from 'react'
import { useDialog } from '@/lib/hooks/useDialog'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { useRouter } from 'next/router'
import { ConfirmationDialog } from '../dialogs/ConfirmationDialog'
import { GenerateKeysDialog } from '../dialogs/GenerateKeysDialog'
import { UploadPublicKeyDialog } from '../dialogs/UploadPublicKeyDialog'

type WalletAddressContextType = {
  walletAddress: WalletAddress
  walletAddressesCount: number
  walletAddressIdx: number
}

const WalletAddressContext = createContext<
  WalletAddressContextType | undefined
>(undefined)

type WalletAddressProviderProps = WalletAddressContextType & {
  children: ReactNode
}

export const useWalletAddressContext = (): WalletAddressContextType => {
  const context = useContext(WalletAddressContext)
  if (!context) {
    throw new Error(
      'useWalletAddressContext must be used within an WalletAddressProvider'
    )
  }
  return context
}

export const WalletAddressProvider = ({
  children,
  walletAddress,
  walletAddressIdx,
  walletAddressesCount
}: WalletAddressProviderProps) => {
  return (
    <WalletAddressContext.Provider
      value={{ walletAddress, walletAddressesCount, walletAddressIdx }}
    >
      {children}
    </WalletAddressContext.Provider>
  )
}

type DeveloperKeysProps = {
  accounts: Account[]
}

export const DeveloperKeys = ({ accounts }: DeveloperKeysProps) => {
  return (
    <dl className="space-y-4 divide-y divide-green/10">
      {accounts.map((account) => (
        <Disclosure as="div" key={account.name} className="pt-4">
          {({ open }) => (
            <>
              <AccountHeader name={account.name} isOpen={open} />
              <AccountPanel walletAddresses={account.walletAddresses} />
            </>
          )}
        </Disclosure>
      ))}
    </dl>
  )
}

type DisclosureGroupHeaderProps = {
  name: string
  isOpen: boolean
}

const AccountHeader = ({ name, isOpen }: DisclosureGroupHeaderProps) => {
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
  walletAddresses: WalletAddress[]
}

const AccountPanel = ({ walletAddresses }: AccountPanelProps) => {
  return (
    <Transition
      className="px-2"
      enter="transition-all ease-in-out duration-300"
      enterFrom="transform max-h-0"
      enterTo="transform max-h-screen"
      leave="transition-all ease-in-out duration-300"
      leaveFrom="transform max-h-screen"
      leaveTo="transform max-h-0"
    >
      <Disclosure.Panel as="dd" className="mt-6 px-2">
        <ul role="list" className="space-y-4">
          {walletAddresses.map((walletAddress, walletAddressIdx) => (
            <WalletAddressProvider
              key={walletAddress.id}
              walletAddress={walletAddress}
              walletAddressesCount={walletAddresses.length}
              walletAddressIdx={walletAddressIdx}
            >
              <WalletAddressInfo />
            </WalletAddressProvider>
          ))}
        </ul>
      </Disclosure.Panel>
    </Transition>
  )
}

const WalletAddressInfo = () => {
  const { walletAddress } = useWalletAddressContext()
  return (
    <li key={walletAddress.url} className="relative flex gap-x-1 text-green">
      <WalletAddressKeyStatus />
      <div className="max-h flex-auto space-y-2 leading-6">
        <p className="font-semibold">{walletAddress.url}</p>
        <div className="flex-none py-0.5 text-sm leading-5">
          <WalletAddressKeyInfo />
        </div>
      </div>
    </li>
  )
}

const KeysGroupHeader = ({
  name,
  createdAt,
  isOpen
}: DisclosureGroupHeaderProps & { createdAt: string }) => {
  return (
    <dt>
      <Disclosure.Button className="flex w-full justify-between rounded-md bg-gradient-violet px-2 shadow-md">
        <div className="flex flex-col py-1 text-left">
          <span className="font-semibold leading-5 text-white">{name}</span>
          <span className="text-xs text-white">Created {createdAt}</span>
        </div>
        <span className="ml-6 mt-1 flex items-center">
          <Chevron
            className="mt-2 h-5 w-5 text-white transition-transform duration-300"
            direction={isOpen ? 'down' : 'left'}
          />
        </span>
      </Disclosure.Button>
    </dt>
  )
}

type KeysGroupPanelProps = {
  keys: WalletAddressKey
  accountId: string
  walletAddressId: string
}

const KeysGroupPanel = ({
  keys,
  accountId,
  walletAddressId
}: KeysGroupPanelProps) => {
  const [openDialog, closeDialog] = useDialog()
  const router = useRouter()
  async function revokePublicAndPrivateKeys() {
    const response = await walletAddressService.revokeKey({
      accountId: accountId,
      walletAddressId: walletAddressId,
      keyId: keys.id
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

  return (
    <Transition
      className="px-2"
      enter="transition-all ease-in-out duration-300"
      enterFrom="transform max-h-0"
      enterTo="transform max-h-screen"
      leave="transition-all ease-in-out duration-300"
      leaveFrom="transform max-h-screen"
      leaveTo="transform max-h-0"
    >
      <Disclosure.Panel as="dd" className="mt-6 px-2">
        <div>
          <div className="flex flex-col justify-between">
            <p className="font-normal">Key ID</p>
            <div className="flex items-center justify-between">
              <span className="font-extralight">{keys.id}</span>
              <CopyButton
                aria-label="copy key id"
                className="h-7 w-7"
                size="sm"
                value={keys.id}
              />
            </div>
          </div>

          <PublicKeyContainer publicKey={keys.publicKey} />
          <Button
            intent="secondary"
            aria-label="revoke keys"
            className="mt-2"
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
            Revoke {keys.nickname}
          </Button>
        </div>
      </Disclosure.Panel>
    </Transition>
  )
}

const WalletAddressKeyStatus = () => {
  const { walletAddress, walletAddressIdx, walletAddressesCount } =
    useWalletAddressContext()
  return (
    <>
      <div
        className={cx(
          walletAddressIdx === walletAddressesCount - 1 ? 'h-6' : '-bottom-6',
          'absolute left-0 top-0 flex w-6 justify-center'
        )}
      >
        <div className="w-px bg-gray-200" />
      </div>

      <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
        <div
          className={cx(
            'h-1.5 w-1.5 rounded-full ring-1',
            walletAddress.keys
              ? 'bg-green-4 ring-green-3'
              : 'bg-gray-100 ring-gray-300'
          )}
        />
      </div>
    </>
  )
}

const WalletAddressKeyInfo = () => {
  const { walletAddress } = useWalletAddressContext()

  return (
    <div className="flex flex-col space-y-2">
      {walletAddress.keys.map((keyInfo) => (
        <Disclosure as="div" key="nickname" className="pt-1">
          {({ open }) => (
            <>
              <KeysGroupHeader
                name={keyInfo.nickname}
                createdAt={keyInfo.createdAt}
                isOpen={open}
              />
              <KeysGroupPanel
                keys={keyInfo}
                walletAddressId={walletAddress.id}
                accountId={walletAddress.accountId}
              />
            </>
          )}
        </Disclosure>
      ))}
      <hr />
      <WalletAddressCTA />
    </div>
  )
}

const WalletAddressCTA = () => {
  const { walletAddress } = useWalletAddressContext()
  const [openDialog, closeDialog] = useDialog()

  return (
    <div className="flex flex-col justify-between gap-1 md:flex-row">
      <Button
        aria-label="generate keys"
        onClick={() =>
          openDialog(
            <GenerateKeysDialog
              onClose={closeDialog}
              accountId={walletAddress.accountId}
              walletAddressId={walletAddress.id}
            ></GenerateKeysDialog>
          )
        }
      >
        Generate public & private key
      </Button>
      <Button
        aria-label="upload keys"
        onClick={() =>
          openDialog(
            <UploadPublicKeyDialog
              onClose={closeDialog}
              accountId={walletAddress.accountId}
              walletAddressId={walletAddress.id}
            ></UploadPublicKeyDialog>
          )
        }
      >
        Upload key
      </Button>
    </div>
  )
}

type PublicKeyContainerProps = {
  publicKey: string
}

const PublicKeyContainer = ({ publicKey }: PublicKeyContainerProps) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="mt-2 flex flex-col justify-between space-y-2">
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
