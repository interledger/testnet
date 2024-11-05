import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild
} from '@headlessui/react'
import { Fragment } from 'react'
import type { DialogProps } from '@/lib/types/dialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { passwordSchema } from '@/lib/api/user'
import { Form } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { Button } from '@/ui/Button'

type PasswordDialogProps = Pick<DialogProps, 'onClose'> & {
  title: string
  onSubmit: (password: string) => Promise<void>
}

export const PasswordDialog = ({
  title,
  onClose,
  onSubmit
}: PasswordDialogProps) => {
  const form = useZodForm({
    schema: passwordSchema
  })
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
              <DialogPanel className="relative w-full max-w-sm space-y-4 overflow-hidden rounded-lg bg-white p-8 shadow-xl dark:bg-purple">
                <DialogTitle as="h3" className="text-center text-2xl font-bold">
                  {title}
                </DialogTitle>
                <Form
                  form={form}
                  onSubmit={async (data) => {
                    await onSubmit(data.password)
                  }}
                >
                  <Input
                    required
                    type="password"
                    {...form.register('password')}
                    error={form.formState.errors.password?.message}
                    label="Password"
                  />
                  <Button type="submit" intent="primary" aria-label={title}>
                    Submit
                  </Button>
                </Form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
