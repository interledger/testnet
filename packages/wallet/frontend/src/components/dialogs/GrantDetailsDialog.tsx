import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild
} from '@headlessui/react'
import { Fragment } from 'react'
import { GrantDetails } from '@/components/GrantDetails'
import { Button } from '@/ui/Button'
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { useDialog } from '@/lib/hooks/useDialog'
import { grantsService } from '@/lib/api/grants'
import { GrantResponse } from '@wallet/shared'
import { useRouter } from 'next/router'

type GrantDetailsDialogProps = {
  onClose: () => void
  grant: GrantResponse
}

export const GrantDetailsDialog = ({
  onClose,
  grant
}: GrantDetailsDialogProps) => {
  const [openDialog, closeDialog] = useDialog()
  const router = useRouter()

  const handleRevoke = async (id: string) => {
    const res = await grantsService.delete(id)
    if (res.success) {
      openDialog(
        <SuccessDialog
          onClose={closeDialog}
          title="Success"
          content="Grant successfully revoked."
        />
      )
      router.replace('/grants')
      onClose()
    } else {
      openDialog(<ErrorDialog onClose={closeDialog} content={res.message} />)
    }
  }

  return (
    <Transition appear show as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <DialogPanel className="w-full max-w-2xl rounded-2xl bg-white dark:bg-purple p-6 text-left shadow-xl">
                <DialogTitle as="h3" className="text-2xl font-bold mb-4">
                  Grant Details
                </DialogTitle>

                <GrantDetails grant={grant} />

                {(grant.finalizationReason === 'ISSUED' ||
                  grant.state !== 'FINALIZED') && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      intent="outline"
                      onClick={() =>
                        openDialog(
                          <ConfirmationDialog
                            confirmText="Revoke Grant"
                            message="Revoking this grant will prevent future payments. Continue?"
                            onConfirm={() => handleRevoke(grant.id)}
                            onClose={closeDialog}
                          />
                        )
                      }
                      aria-label={''}
                    >
                      Revoke Grant
                    </Button>
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
