import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild
} from '@headlessui/react'
import { Fragment } from 'react'
import type { DialogProps } from '@/lib/types/dialog'
import {
  cardService,
  dailySpendingLimitSchema,
  monthlySpendingLimitSchema
} from '@/lib/api/card'
import { useRouter } from 'next/router'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { getObjectKeys } from '@/utils/helpers'
import { Form } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { Button } from '@/ui/Button'

type UserCardSpendingLimitDialogProos = Pick<DialogProps, 'onClose'>

export const UserCardSpendingLimitDialog = ({
  onClose
}: UserCardSpendingLimitDialogProos) => {
  return (
    <Transition show={true} as={Fragment} appear={true}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
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
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <DialogPanel className="relative w-full max-w-xl space-y-4 overflow-hidden rounded-lg bg-white p-8 shadow-xl dark:bg-purple">
                <DialogTitle as="h3" className="text-center text-2xl font-bold">
                  Spending Limit
                </DialogTitle>
                <div className="space-y-10">
                  <DailySpendingLimitForm />
                  <MonthlySpendingLimitForm />
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

// TODO: We will probably need to fetch the existing limitt
const DailySpendingLimitForm = () => {
  const router = useRouter()
  const form = useZodForm({
    schema: dailySpendingLimitSchema
  })

  return (
    <Form
      form={form}
      onSubmit={async (data) => {
        const response = await cardService.setDailySpendingLimit(data)

        if (response.success) {
          router.replace(router.asPath)
        } else {
          const { errors, message } = response
          form.setError('root', {
            message
          })
          if (errors) {
            getObjectKeys(errors).map((field) =>
              form.setError(field, {
                message: errors[field]
              })
            )
          }
        }
      }}
    >
      <div className="flex gap-x-5">
        <div className="flex-1">
          <Input
            type="password"
            inputMode="numeric"
            className="w-full"
            maxLength={4}
            label="Daily Spending Limit"
            placeholder="Set daily spending limit"
            error={form.formState?.errors?.amount?.message}
            {...form.register('amount')}
          />
        </div>
        <Button
          aria-label="change pin"
          className="self-end"
          type="submit"
          loading={form.formState.isSubmitting}
        >
          Save
        </Button>
      </div>
    </Form>
  )
}

// TODO: We will probably need to fetch the existing limitt
const MonthlySpendingLimitForm = () => {
  const router = useRouter()
  const form = useZodForm({
    schema: monthlySpendingLimitSchema
  })

  return (
    <Form
      form={form}
      onSubmit={async (data) => {
        const response = await cardService.setMonthlySpendingLimit(data)

        if (response.success) {
          router.replace(router.asPath)
        } else {
          const { errors, message } = response
          form.setError('root', {
            message
          })
          if (errors) {
            getObjectKeys(errors).map((field) =>
              form.setError(field, {
                message: errors[field]
              })
            )
          }
        }
      }}
    >
      <div className="flex gap-x-5">
        <div className="flex-1">
          <Input
            type="password"
            inputMode="numeric"
            className="w-full"
            maxLength={4}
            label="Monthly Spending Limit"
            placeholder="Set monthly spending limit"
            error={form.formState?.errors?.amount?.message}
            {...form.register('amount')}
          />
        </div>
        <Button
          aria-label="change pin"
          className="self-end"
          type="submit"
          loading={form.formState.isSubmitting}
        >
          Save
        </Button>
      </div>
    </Form>
  )
}
