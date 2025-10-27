import { type ComponentProps } from 'react'
import { Chip, InterledgerLogo } from '../icons/UserCardIcons'
import { cn } from '@/utils/helpers'
import { isLockedCard, KeysProvider, UserCardContext } from './UserCardContext'
import { UserCardActions } from './UserCardActions'
import { ICardResponse } from '@wallet/shared'

export type UserCardContainerProps = ComponentProps<'div'>

const UserCardContainer = ({
  children,
  className,
  ...props
}: UserCardContainerProps) => {
  return (
    <div
      className={cn(
        'relative text-[#040607] font-sans w-80 h-52 rounded-xl bg-gradient-to-r from-[#D8EEEC] via-[#A0D5D5] to-[#36B3B0] shadow-[rgba(0,0,0,0.16)_0px_10px_36px_0px,rgba(0,0,0,0.06)_0px_0px_0px_1px] py-4 px-5 overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface UserCardFrontProps extends ComponentProps<'div'> {
  cardWalletAddress: string
  isBlocked: boolean
}

// Even if the UserCard lives inside the context we explicitly pass the card
// details as a prop, since we have to use this component in dialogs as well.
export const UserCardFront = ({
  cardWalletAddress,
  isBlocked,
  className,
  ...props
}: UserCardFrontProps) => {
  return (
    <UserCardContainer className={className} {...props}>
      <div
        className={cn(
          'flex flex-col h-full',
          isBlocked ? 'select-none pointer-events-none blur' : ''
        )}
      >
        <div className="flex justify-between text-sm items-center">
          <InterledgerLogo />
          <span className="font-sans">debit</span>
        </div>
        <div className="ml-4 mt-5">
          <Chip />
        </div>
        <div className="flex mt-auto justify-between items-center">
          <span className="uppercase text-sm">
            {cardWalletAddress.replace('https://', '$')}
          </span>
        </div>
      </div>
      {isBlocked ? (
        <div className="absolute inset-0 z-10 bg-[url('/frozen.webp')] bg-cover bg-center opacity-50" />
      ) : null}
    </UserCardContainer>
  )
}

interface UserCardProps {
  card: ICardResponse
}

export const UserCard = ({ card }: UserCardProps) => {
  if (card.status === 'TERMINATED') {
    return <>Your card has been terminated.</>
  }

  const isBlocked = isLockedCard(card)

  return (
    <UserCardContext.Provider value={{ card }}>
      <KeysProvider>
        {/* <SetPinForm /> */}

        <div className="grid grid-cols-1 lg:grid-cols-[20rem_1fr] max-w-3xl gap-x-24">
          <div className="space-y-6 max-w-80 mx-auto">
            <UserCardFront
              cardWalletAddress={card.walletAddress.url}
              isBlocked={isBlocked}
            />

            <UserCardActions />
          </div>
          {/* old cards PIN settings - new cards still in discussion */}
          {/* <UserCardSettings /> */}
        </div>
      </KeysProvider>
    </UserCardContext.Provider>
  )
}

// old cards activated when you set PIN - new cards still in discussion
// const SetPinForm = () => {
//   const router = useRouter()
//   const { card } = useCardContext()
// const { toast } = useToast()
// const form = useZodForm({
//   schema: changePinSchema
// })
// <Form
//   form={form}
//   className="max-w-lg mx-auto"
//   onSubmit={async (data) => {
//     const response = await cardService.getChangePinToken(card.id)

//     if (!response.success) {
//       toast({
//         description:
//           'Could not get details for change PIN. Please try again.',
//         variant: 'error'
//       })
//       console.error(response.message)
//       return
//     }

//     if (!response.result) {
//       toast({
//         description:
//           'Could not get details for change PIN. Please try again.',
//         variant: 'error'
//       })
//       console.error(response.message)
//       return
//     }

//     const token = response.result

//     const { publicKey } = parseJwt(token) as {
//       publicKey: string
//     }

//     const pemPublicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`

//     const buf = Buffer.from(data.pin, 'utf8')
//     const cypher = crypto
//       .publicEncrypt(
//         {
//           key: pemPublicKey,
//           padding: crypto.constants.RSA_PKCS1_PADDING
//         },
//         buf
//       )
//       .toString('base64')

//     const res = await cardService.changePin(card.id, {
//       token,
//       cypher
//     })

//     if (!res.success) {
//       toast({
//         description: 'Could not change PIN for card. Please try again.',
//         variant: 'error'
//       })
//       console.error(response.message)
//       return
//     }

//     toast({
//       description: 'Card PIN was successfully set.',
//       variant: 'success'
//     })
//     router.replace(router.asPath)
//   }}
// >
//   <p className="text-2xl">Set PIN</p>
//   <Input
//     type="password"
//     inputMode="numeric"
//     label="PIN"
//     required
//     maxLength={4}
//     placeholder="Enter PIN"
//     error={form.formState?.errors?.pin?.message}
//     {...form.register('pin')}
//   />
//   <Input
//     type="password"
//     inputMode="numeric"
//     label="Confirm PIN"
//     required
//     maxLength={4}
//     placeholder="Repeat PIN"
//     error={form.formState?.errors?.confirmPin?.message}
//     {...form.register('confirmPin')}
//   />
//   <Button
//     aria-label="set pin"
//     type="submit"
//     loading={form.formState.isSubmitting}
//   >
//     Confirm PIN change
//   </Button>
// </Form>
//   )
// }
