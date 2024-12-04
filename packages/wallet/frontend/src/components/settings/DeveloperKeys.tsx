import { Account } from '@/lib/api/account'
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Transition
} from '@headlessui/react'
import { Chevron } from '../icons/Chevron'
import { walletAddressService } from '@/lib/api/walletAddress'
import { cx } from 'class-variance-authority'
import { CopyButton } from '@/ui/CopyButton'
import { Button } from '@/ui/Button'
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState
} from 'react'
import { useDialog } from '@/lib/hooks/useDialog'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { useRouter } from 'next/router'
import { ConfirmationDialog } from '../dialogs/ConfirmationDialog'
import { GenerateKeysDialog } from '../dialogs/GenerateKeysDialog'
import { UploadPublicKeyDialog } from '../dialogs/UploadPublicKeyDialog'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { WalletAddressResponse } from '@wallet/shared/src'
import { WalletAddressKeyResponse } from '@wallet/shared/src/types/WalletAddressKey'

type WalletAddressContextType = {
  walletAddress: WalletAddressResponse
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
    <dl className="space-y-4">
      {accounts.map((account, accountIdx) => (
        <Disclosure as="div" key={account.name} className="pt-2">
          {({ open }) => (
            <>
              <AccountHeader
                name={account.name}
                isOpen={open}
                index={accountIdx}
              />
              <AccountPanel
                walletAddresses={account.walletAddresses}
                index={accountIdx}
              />
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
  index: number
}

const AccountHeader = ({ name, isOpen, index }: DisclosureGroupHeaderProps) => {
  const { setRunOnboarding, isDevKeysOnboarding } = useOnboardingContext()
  return (
    <dt>
      <DisclosureButton className="flex w-full justify-between rounded-md border border-pink-dark px-2 py-1 dark:border-teal-neon">
        <span className="font-semibold leading-7 text-pink-dark dark:text-teal-neon">
          Account: {name}
        </span>
        <span className="ml-6 flex items-center">
          <Chevron
            className="h-6 w-6 text-pink-dark transition-transform duration-300 dark:text-teal-neon mt-0.5"
            direction={isOpen ? 'down' : 'right'}
            id={index === 0 ? 'accountsList' : ''}
            onClick={() => {
              if (isDevKeysOnboarding) {
                setRunOnboarding(false)
              }
            }}
          />
        </span>
      </DisclosureButton>
    </dt>
  )
}

type AccountPanelProps = {
  walletAddresses: WalletAddressResponse[]
  index: number
}

const AccountPanel = ({ walletAddresses, index }: AccountPanelProps) => {
  const { setRunOnboarding, isDevKeysOnboarding, stepIndex, setStepIndex } =
    useOnboardingContext()
  return (
    <Transition
      afterEnter={() => {
        if (isDevKeysOnboarding) {
          setTimeout(() => {
            setStepIndex(stepIndex + 1)
            setRunOnboarding(true)
          }, 700)
        }
      }}
      enter="transition-all ease-in-out duration-300"
      enterFrom="transform max-h-0"
      enterTo="transform max-h-screen"
      leave="transition-all ease-in-out duration-300"
      leaveFrom="transform max-h-screen"
      leaveTo="transform max-h-0"
    >
      <DisclosurePanel as="dd" className="mt-6 px-2 mb-14">
        <ul role="list" className="space-y-4">
          {walletAddresses.map((walletAddress, walletAddressIdx) => (
            <WalletAddressProvider
              key={walletAddress.id}
              walletAddress={walletAddress}
              walletAddressesCount={walletAddresses.length}
              walletAddressIdx={walletAddressIdx}
            >
              <WalletAddressInfo
                accountIdx={index}
                walletAddressIdx={walletAddressIdx}
              />
            </WalletAddressProvider>
          ))}
        </ul>
      </DisclosurePanel>
    </Transition>
  )
}

type WalletAddressInfoProps = {
  accountIdx: number
  walletAddressIdx: number
}

const WalletAddressInfo = ({
  accountIdx,
  walletAddressIdx
}: WalletAddressInfoProps) => {
  const { walletAddress } = useWalletAddressContext()
  return (
    <li key={walletAddress.url} className="relative flex gap-x-1">
      <WalletAddressKeyStatus />
      <div className="max-h flex-auto space-y-2 leading-6">
        <p className="font-semibold">{walletAddress.url}</p>
        <div className="flex-none py-0.5 text-sm leading-5">
          <WalletAddressKeyInfo
            accountIdx={accountIdx}
            walletAddressIdx={walletAddressIdx}
          />
        </div>
      </div>
    </li>
  )
}

const KeysGroupHeader = ({
  name,
  createdAt,
  isOpen,
  index,
  accountIdx,
  walletAddressIdx
}: DisclosureGroupHeaderProps &
  WalletAddressInfoProps & { createdAt: string }) => {
  const { setRunOnboarding, isDevKeysOnboarding, stepIndex, setStepIndex } =
    useOnboardingContext()

  useEffect(() => {
    if (isDevKeysOnboarding && stepIndex === 31) {
      setStepIndex(stepIndex + 1)
      setRunOnboarding(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <dt>
      <DisclosureButton className="flex w-full justify-between rounded-md border border-purple-bright dark:border-green-neon px-2">
        <div className="flex flex-col py-1 text-left">
          <span className="font-semibold leading-5 text-purple-bright dark:text-green-neon">
            {name}
          </span>
          <span className="text-xs text-purple-bright dark:text-green-neon">
            Created {createdAt}
          </span>
        </div>
        <span className="ml-6 mt-1 flex items-center">
          <Chevron
            className="mt-2 h-5 w-5 text-purple-bright dark:text-green-neon transition-transform duration-300"
            direction={isOpen ? 'down' : 'right'}
            id={
              accountIdx === 0 && walletAddressIdx === 0 && index === 0
                ? 'keysList'
                : ''
            }
            onClick={() => {
              if (isDevKeysOnboarding) {
                setRunOnboarding(false)
              }
            }}
          />
        </span>
      </DisclosureButton>
    </dt>
  )
}

type KeysGroupPanelProps = {
  keys: WalletAddressKeyResponse
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
  const { setRunOnboarding, isDevKeysOnboarding, stepIndex, setStepIndex } =
    useOnboardingContext()

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
      enter="transition-all ease-in-out duration-300"
      enterFrom="transform max-h-0"
      enterTo="transform max-h-screen"
      leave="transition-all ease-in-out duration-300"
      leaveFrom="transform max-h-screen"
      leaveTo="transform max-h-0"
      afterEnter={() => {
        if (isDevKeysOnboarding) {
          setStepIndex(stepIndex + 1)
          setRunOnboarding(true)
        }
      }}
    >
      <DisclosurePanel as="dd" className="m-4 px-2">
        <div id="keysDetails">
          <div className="flex flex-col justify-between">
            <p className="font-semibold">Key ID</p>
            <div className="flex items-center justify-between">
              <span className="font-extralight">{keys.id}</span>
              <CopyButton
                aria-label="copy key id"
                className="h-7 w-7"
                value={keys.id}
              />
            </div>
          </div>

          <PublicKeyContainer publicKey={keys.publicKey} />
          <Button
            intent="outline"
            size="sm"
            aria-label="revoke keys"
            className="mt-2"
            onClick={() =>
              openDialog(
                <ConfirmationDialog
                  confirmText="Revoke key"
                  onConfirm={() => revokePublicAndPrivateKeys()}
                  onClose={closeDialog}
                />
              )
            }
          >
            Revoke {keys.nickname}
          </Button>
        </div>
      </DisclosurePanel>
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

      <div className="relative flex h-6 w-6 flex-none items-center justify-center">
        <div
          className={cx(
            'h-1.5 w-1.5 rounded-full ring-1',
            walletAddress.keys
              ? 'bg-black ring-black dark:bg-white dark:ring-white'
              : 'bg-gray-100 ring-gray-300'
          )}
        />
      </div>
    </>
  )
}

const WalletAddressKeyInfo = ({
  accountIdx,
  walletAddressIdx
}: WalletAddressInfoProps) => {
  const { walletAddress } = useWalletAddressContext()

  return (
    <div className="flex flex-col space-y-2">
      {walletAddress.keys.map((keyInfo, keysIdx) => (
        <Disclosure as="div" key={`nickname_${keysIdx}`} className="pt-1">
          {({ open }) => (
            <>
              <KeysGroupHeader
                name={keyInfo.nickname}
                createdAt={keyInfo.createdAt.toString()}
                isOpen={open}
                index={keysIdx}
                accountIdx={accountIdx}
                walletAddressIdx={walletAddressIdx}
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
      <WalletAddressCTA
        accountIdx={accountIdx}
        walletAddressIdx={walletAddressIdx}
      />
    </div>
  )
}

const WalletAddressCTA = ({
  accountIdx,
  walletAddressIdx
}: WalletAddressInfoProps) => {
  const { walletAddress } = useWalletAddressContext()
  const [openDialog, closeDialog] = useDialog()
  const { setRunOnboarding, isDevKeysOnboarding } = useOnboardingContext()
  return (
    <div className="flex flex-col justify-between gap-1 md:flex-row pt-3">
      <Button
        aria-label="generate keys"
        size="sm"
        id={accountIdx === 0 && walletAddressIdx === 0 ? 'generateKey' : ''}
        onClick={() => {
          openDialog(
            <GenerateKeysDialog
              onClose={closeDialog}
              accountId={walletAddress.accountId}
              walletAddressId={walletAddress.id}
            ></GenerateKeysDialog>
          )
          if (isDevKeysOnboarding) {
            setRunOnboarding(false)
          }
        }}
      >
        Generate public & private key
      </Button>
      <Button
        aria-label="upload keys"
        size="sm"
        id={accountIdx === 0 && walletAddressIdx === 0 ? 'uploadKey' : ''}
        onClick={() => {
          openDialog(
            <UploadPublicKeyDialog
              onClose={closeDialog}
              accountId={walletAddress.accountId}
              walletAddressId={walletAddress.id}
            ></UploadPublicKeyDialog>
          )
          if (isDevKeysOnboarding) {
            setRunOnboarding(false)
          }
        }}
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
          intent="outline"
          size="sm"
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
            className="block w-full resize-none border-0 p-1.5 text-sm disabled:bg-green-light dark:disabled:bg-purple-dark"
            value={publicKey}
          />
        </div>
      ) : null}
    </div>
  )
}
