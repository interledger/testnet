import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild
} from '@headlessui/react'
import { Fragment } from 'react'
import type { DialogProps } from '@/lib/types/dialog'
import { UserCardFront } from '@/components/userCards/UserCard'
import { ICardResponse } from '@wallet/shared'

type UserCardPINDialogProos = Pick<DialogProps, 'onClose'> & {
  card: ICardResponse
  pin: string
}

export const UserCardPINDialog = ({
  card,
  pin,
  onClose
}: UserCardPINDialogProos) => {
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
              <DialogPanel className="relative w-full max-w-sm space-y-4 overflow-hidden rounded-lg bg-white p-8 shadow-xl dark:bg-purple">
                <DialogTitle as="h3" className="text-center text-2xl font-bold">
                  Here is your card PIN
                </DialogTitle>
                <div className="flex space-x-5">
                  <UserCardFront
                    nameOnCard={card.nameOnCard}
                    isBlocked={false}
                    className="origin-top-left scale-[.3] [margin:0_calc(-20rem*(1-.3))_calc(-13rem*(1-0.3))_0] "
                  />
                  <div>
                    <p className="pl-10 tracking-widest text-6xl pt-1">{pin}</p>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

// const ChangePinForm = () => {
//   const [showForm, setShowForm] = useState(false)
//   const router = useRouter()
//   const form = useZodForm({
//     schema: changePinSchema
//   })
//
//   if (!showForm) {
//     return (
//       <Button
//         className="w-full"
//         aria-label="show change pin form"
//         onClick={() => setShowForm(true)}
//       >
//         Change PIN
//       </Button>
//     )
//   }
//   return (
//     <Form
//       form={form}
//       onSubmit={async (data) => {
//         const response = await cardServiceMock.changePin(data)
//
//         if (response.success) {
//           router.replace(router.asPath)
//         } else {
//           const { errors, message } = response
//           form.setError('root', {
//             message
//           })
//           if (errors) {
//             getObjectKeys(errors).map((field) =>
//               form.setError(field, {
//                 message: errors[field]
//               })
//             )
//           }
//         }
//       }}
//     >
//       <Input
//         type="password"
//         inputMode="numeric"
//         maxLength={4}
//         placeholder="Enter PIN"
//         error={form.formState?.errors?.pin?.message}
//         {...form.register('pin')}
//       />
//       <Input
//         type="password"
//         inputMode="numeric"
//         maxLength={4}
//         placeholder="Repeat PIN"
//         error={form.formState?.errors?.confirmPin?.message}
//         {...form.register('confirmPin')}
//       />
//       <Button
//         aria-label="change pin"
//         type="submit"
//         loading={form.formState.isSubmitting}
//       >
//         Confirm PIN change
//       </Button>
//     </Form>
//   )
// }
