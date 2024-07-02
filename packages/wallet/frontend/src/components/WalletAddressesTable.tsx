import { Account } from '@/lib/api/account'
import { walletAddressService } from '@/lib/api/walletAddress'
import { useDialog } from '@/lib/hooks/useDialog'
import { Link } from '@/ui/Link'
import { IWalletAddressResponse } from '@wallet/shared'
import { useRouter } from 'next/router'
import { SuccessDialog } from './dialogs/SuccessDialog'
import { ErrorDialog } from './dialogs/ErrorDialog'
import { EditWalletAddressDialog } from './dialogs/EditWalletAddressDialog'
import { ConfirmationDialog } from './dialogs/ConfirmationDialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/ui/Tooltip'
import { copyToClipboard } from '@/ui/CopyButton'
import { createContext, useContext, useEffect, useState } from 'react'
import { formatAmount } from '@/utils/helpers'

interface WalletAddressesTableProps {
  isWM: boolean
  account: Account
  walletAddresses: IWalletAddressResponse[]
}

interface WalletAddressRowProps {
  walletAddress: IWalletAddressResponse
  isWM: boolean
  idOnboarding: string
}

type WalletAddressRowContextValue = WalletAddressRowProps

const formattedAmount = (walletAddress: IWalletAddressResponse) => {
  return formatAmount({
    value: walletAddress.incomingBalance.toString() || '',
    assetCode: walletAddress.assetCode || '',
    assetScale: walletAddress.assetScale || 2
  })
}

export const WalletAddressRowContext =
  createContext<WalletAddressRowContextValue>(
    {} as WalletAddressRowContextValue
  )

const DeleteWalletAddress = () => {
  const router = useRouter()
  const { walletAddress } = useContext(WalletAddressRowContext)
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
    <Link
      aria-label="delete payment pointer"
      onClick={() =>
        openDialog(
          <ConfirmationDialog
            confirmText="Delete payment pointer"
            onConfirm={() => handleDeleteConfirmation(walletAddress.id)}
            onClose={closeDialog}
          />
        )
      }
    >
      Delete
    </Link>
  )
}

const EditWalletAddress = () => {
  const { walletAddress } = useContext(WalletAddressRowContext)
  const [openDialog, closeDialog] = useDialog()

  return (
    <Link
      aria-label="Edit payment pointer"
      onClick={() =>
        openDialog(
          <EditWalletAddressDialog
            walletAddress={walletAddress}
            onClose={closeDialog}
          />
        )
      }
    >
      Edit
    </Link>
  )
}

export const CopyWalletAddress = () => {
  const { walletAddress } = useContext(WalletAddressRowContext)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setIsCopied(false)
    }, 4000)
  }, [isCopied])

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger
          onClick={(e) => {
            e.preventDefault()
            setIsCopied(true)
            copyToClipboard(walletAddress.url)
          }}
        >
          <p className="underline decoration-dashed underline-offset-2">
            {walletAddress.url}
          </p>
        </TooltipTrigger>
        <TooltipContent onPointerDownOutside={(e) => e.preventDefault()}>
          {isCopied ? 'Copied' : 'Copy to clipboard'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export const WalletAddressRow = ({
  walletAddress,
  isWM,
  idOnboarding
}: WalletAddressRowProps) => {
  return (
    <WalletAddressRowContext.Provider
      value={{ walletAddress, isWM, idOnboarding }}
    >
      <tr
        className="[&>td]:p-4 [&>td]:border-b [&>td]:border-green dark:[&>td]:border-pink-neon hover:bg-green-light dark:hover:bg-purple-dark"
        key={walletAddress.id}
      >
        <td>
          <CopyWalletAddress />
        </td>
        <td>
          {isWM ? (
            <span className="flex items-center justify-center px-3">
              {formattedAmount(walletAddress).amount}
            </span>
          ) : (
            <Link
              href={`/transactions?walletAddressId=${walletAddress.id}`}
              aria-label="view payment pointer transactions"
              id={idOnboarding}
            >
              View
            </Link>
          )}
        </td>
        <td>
          <EditWalletAddress />
        </td>
        <td>
          <DeleteWalletAddress />
        </td>
      </tr>
    </WalletAddressRowContext.Provider>
  )
}

export const WalletAddressesTable = ({
  account,
  walletAddresses,
  isWM
}: WalletAddressesTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[35rem] border-collapse">
        <tbody>
          {walletAddresses.map((walletAddress, idx) => (
            <WalletAddressRow
              key={walletAddress.id}
              isWM={isWM}
              idOnboarding={
                account.assetCode === 'EUR' && idx === 0
                  ? 'viewTransactions'
                  : ''
              }
              walletAddress={walletAddress}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
