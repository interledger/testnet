import { useDialog } from '@/lib/hooks/useDialog'
import { cx } from 'class-variance-authority'
import { Fragment, SVGProps, forwardRef } from 'react'
import { ConfirmationDialog } from '../dialogs/ConfirmationDialog'
import { walletAddressService } from '@/lib/api/walletAddress'
import { ButtonOrLink, ButtonOrLinkProps } from '@/ui/ButtonOrLink'
import { SuccessDialog } from '../dialogs/SuccessDialog'
import { ErrorDialog } from '../dialogs/ErrorDialog'
import { useRouter } from 'next/router'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { Menu, Transition } from '@headlessui/react'
import { EllipsisV } from '../icons/Ellipsis'
import { PencilSquare } from '../icons/Pencil'
import { Trash } from '../icons/Trash'
import { EditWalletAddressDialog } from '../dialogs/EditWalletAddressDialog'
import { CopyButton } from '@/ui/CopyButton'
import { WalletAddressResponse } from '@wallet/shared'

type WalletAddressCardProps = {
  walletAddress: WalletAddressResponse
  idOnboarding?: string
}

type WalletAddressCardButtonProps = ButtonOrLinkProps & {
  ['aria-label']: string
}

const WalletAddressCardButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  WalletAddressCardButtonProps
>(({ className, children, ...props }, ref) => {
  const { isUserFirstTime, setRunOnboarding } = useOnboardingContext()
  return (
    <ButtonOrLink
      ref={ref}
      className={cx(
        className,
        'mr-4 inline-flex items-center justify-center rounded-md px-2 font-medium text-white hover:shadow-md'
      )}
      onClick={() => {
        if (isUserFirstTime) {
          setRunOnboarding(false)
        }
      }}
      {...props}
    >
      {children}
    </ButtonOrLink>
  )
})
WalletAddressCardButton.displayName = 'WalletAddressCardButton'

export const WalletAddressCard = ({
  walletAddress,
  idOnboarding
}: WalletAddressCardProps) => {
  return (
    <div className={cardStyles}>
      <div className="flex flex-1 items-center justify-between space-x-2">
        <span className="px-1 font-medium">{walletAddress.url}</span>
        <div className="flex">
          <WalletAddressCardButton
            href={`/transactions?walletAddressId=${walletAddress.id}`}
            aria-label="view payment pointer"
            id={idOnboarding}
          >
            View
          </WalletAddressCardButton>

          <CopyButton
            aria-label="copy pp"
            className="h-7 w-7"
            size="sm"
            value={walletAddress.url}
          />
        </div>
      </div>

      <WalletAddressOptions walletAddress={walletAddress} />
    </div>
  )
}

type WalletAddressOptionsProps = {
  walletAddress: WalletAddressResponse
}

const WalletAddressOptions = ({ walletAddress }: WalletAddressOptionsProps) => {
  const router = useRouter()
  const [openDialog, closeDialog] = useDialog()

  const handleDeleteConfirmation = async (id: string) => {
    const response = await walletAddressService.delete(id)
    if (response.success) {
      openDialog(
        <SuccessDialog
          onClose={() => {
            closeDialog()
            router.replace(router.asPath)
          }}
          content={response.message}
        />
      )
    } else {
      openDialog(
        <ErrorDialog onClose={closeDialog} content={response.message} />
      )
    }
  }
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
              <Menu.Button className="flex items-center rounded-full text-green-5 hover:text-green-6 focus:outline-none">
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
                className={`fixed inset-x-0 bottom-0 z-30 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-green-5 focus:outline-none md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:mt-2 md:w-56 lg:bottom-auto lg:left-full lg:top-0 lg:ml-3 lg:mt-0 lg:origin-top-left`}
              >
                <div className="py-1 text-green">
                  <Option
                    name="Edit"
                    Icon={PencilSquare}
                    aria-label="Edit payment pointer"
                    action={() =>
                      openDialog(
                        <EditWalletAddressDialog
                          walletAddress={walletAddress}
                          onClose={closeDialog}
                        />
                      )
                    }
                  />
                  <Option
                    name="Delete"
                    intent="danger"
                    Icon={Trash}
                    aria-label="delete payment pointer"
                    action={() =>
                      openDialog(
                        <ConfirmationDialog
                          confirmText="Delete payment pointer"
                          onConfirm={() =>
                            handleDeleteConfirmation(walletAddress.id)
                          }
                          onClose={closeDialog}
                        />
                      )
                    }
                  />
                </div>
              </Menu.Items>
            </Transition>
          </>
        )
      }}
    </Menu>
  )
}

type OptionProps = {
  ['aria-label']: string
  name: string
  action: () => Promise<void> | void
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
  intent?: 'default' | 'danger'
}

const Option = ({
  action,
  intent = 'default',
  name,
  Icon,
  ...props
}: OptionProps) => {
  return (
    <Menu.Item>
      {({ active }) => (
        <button
          {...props}
          onClick={action}
          className={cx(
            intent === 'danger' && '!text-pink-2',
            active && 'bg-green-4',
            'flex w-full items-start space-x-4 px-4 py-2'
          )}
        >
          <Icon className="h-6 w-6" />
          <span>{name}</span>
        </button>
      )}
    </Menu.Item>
  )
}

const cardStyles = `
flex items-center justify-between border-b border-b-green-4 px-2 py-3 space-x-4
[&:nth-child(4n+1)_div_a]:bg-green-5 [&:nth-child(4n+1)_div_a:hover]:bg-green-6 
[&:nth-child(4n+2)_div_a]:bg-violet-1 [&:nth-child(4n+2)_div_a:hover]:bg-violet-2
[&:nth-child(4n+3)_div_a]:bg-pink-1 [&:nth-child(4n+3)_div_a:hover]:bg-pink-2
[&:nth-child(4n+4)_div_a]:bg-orange-1 [&:nth-child(4n+4)_div_a:hover]:bg-orange-2
first:[&:nth-child(4n+1)_span]:text-green-6
first:[&:nth-child(4n+2)_span]:text-violet-2
first:[&:nth-child(4n+3)_span]:text-pink-2
first:[&:nth-child(4n+4)_span]:text-orange-2
`
