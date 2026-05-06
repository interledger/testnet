import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild
} from '@headlessui/react'
import { Fragment } from 'react'
import type { DialogProps } from '@/lib/types/dialog'
import { TransactionListResponse } from '@wallet/shared/src/types/transaction'
import {
  formatAmount,
  formatDate,
  getCardTransactionType,
  getCurrencySymbol,
  replaceCardWalletAddressDomain
} from '@/utils/helpers'
import { cx } from 'class-variance-authority'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import { Card } from '../icons/CardButtons'
import { FEATURES_ENABLED } from '@/utils/constants'
import { Button } from '@/ui/Button'
import { useRouter } from 'next/router'
import { useRefundContext } from '@/lib/context/refund'

type TransactionDetailsDialogProps = Pick<DialogProps, 'onClose'> & {
  transaction: TransactionListResponse
  isCardWalletAddress: boolean
}

export const TransactionDetailsDialog = ({
  onClose,
  transaction,
  isCardWalletAddress
}: TransactionDetailsDialogProps) => {
  const router = useRouter()
  const { setReceiverWalletAddress } = useRefundContext()

  return (
    <Transition show={true} as={Fragment} appear={true}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-green-modal/75 transition-opacity dark:bg-black/75" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <DialogPanel className="relative w-full max-w-xl space-y-4 overflow-hidden rounded-lg bg-white p-4 sm:p-8 shadow-xl dark:bg-purple">
                <DialogTitle as="h3" className="text-center text-2xl font-bold">
                  <div className="flex flex-row justify-center items-center gap-x-4">
                    Transaction Details
                    {transaction.isCard && FEATURES_ENABLED ? (
                      <div className="text-dark-green dark:text-white pr-2">
                        <Card />
                      </div>
                    ) : null}
                  </div>
                </DialogTitle>
                <div className="flex flex-col gap-y-2">
                  <div>
                    <span className="font-bold">Date: </span>
                    <span>
                      {formatDate({ date: transaction.createdAt.toString() })}
                    </span>
                  </div>
                  {transaction.secondParty ? (
                    <div>
                      <span className="font-bold">
                        {transaction.type === 'INCOMING'
                          ? 'Sender: '
                          : 'Receiver: '}
                      </span>
                      <span>{transaction.secondParty}</span>
                    </div>
                  ) : null}
                  {transaction.secondPartyWA ? (
                    <div>
                      <span className="font-bold">
                        {transaction.type === 'INCOMING'
                          ? 'Sender Wallet Address: '
                          : 'Receiver Wallet Address: '}
                      </span>
                      <span>{transaction.secondPartyWA}</span>
                    </div>
                  ) : null}
                  <div>
                    <span className="font-bold">
                      {transaction.txAmount ? `Billed Amount: ` : `Amount: `}
                    </span>
                    <span
                      className={cx(
                        transaction.type === 'INCOMING' &&
                          'text-green-dark dark:text-green-neon',
                        transaction.type === 'OUTGOING' &&
                          'text-pink-dark dark:text-yellow-neon'
                      )}
                    >
                      {transaction.type === 'INCOMING' ? '+' : '-'}
                      {
                        formatAmount({
                          value: String(transaction.value) || '0',
                          assetCode: transaction.assetCode,
                          assetScale: transaction.assetScale
                        }).amount
                      }
                    </span>
                  </div>
                  {transaction.txAmount && transaction.txCurrency ? (
                    <>
                      <div>
                        <span className="font-bold">Transaction amount: </span>
                        <span>
                          {
                            formatAmount({
                              value: String(transaction.txAmount) || '0',
                              assetCode: transaction.txCurrency,
                              assetScale: transaction.assetScale
                            }).amount
                          }
                        </span>
                      </div>
                      {transaction.conversionRate ? (
                        <div>
                          <span className="font-bold">Exchange Rate: </span>
                          <span>{transaction.conversionRate}</span>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  {transaction.cardTxType !== undefined &&
                  transaction.cardTxType !== null ? (
                    <div>
                      <span className="font-bold">Transaction Type: </span>
                      <span>
                        {getCardTransactionType(transaction.cardTxType)}
                      </span>
                    </div>
                  ) : null}
                  {transaction.description ? (
                    <div>
                      <span className="font-bold">Description: </span>
                      <span>{transaction.description}</span>
                    </div>
                  ) : null}
                  <div>
                    <span className="font-bold">
                      Wallet Address Public Name:{' '}
                    </span>
                    <span>{transaction.walletAddressPublicName}</span>
                  </div>
                  {transaction.walletAddressUrl ? (
                    <div>
                      <span className="font-bold">Your Wallet Address: </span>
                      <span>
                        {replaceCardWalletAddressDomain(
                          transaction.walletAddressUrl,
                          isCardWalletAddress
                        )}
                      </span>
                    </div>
                  ) : null}
                  <div>
                    <span className="font-bold">Account: </span>
                    <span>
                      {transaction.accountName} -{' '}
                      {getCurrencySymbol(transaction.assetCode)}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold">Status: </span>
                    <span>
                      <Badge
                        intent={getStatusBadgeIntent(transaction.status)}
                        size="md"
                        text={transaction.status}
                      />
                    </span>
                  </div>
                  {transaction.secondPartyWA ? (
                    <div className="flex justify-center">
                      <Button
                        intent="outline"
                        aria-label="send redirect"
                        onClick={() => {
                          setReceiverWalletAddress(
                            transaction.secondPartyWA
                              ? transaction.secondPartyWA
                              : ''
                          )
                          router.push('/send')
                          onClose()
                        }}
                      >
                        {transaction.type === 'INCOMING'
                          ? 'Refund'
                          : 'Send Again'}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
