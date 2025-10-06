import { useState, type ComponentProps } from 'react'
import { CopyButton } from '@/ui/CopyButton'
import { Chip, InterledgerLogo } from '../icons/UserCardIcons'
import { cn, parseJwt } from '@/utils/helpers'
import {
  ICardData,
  isLockedCard,
  KeysProvider,
  useCardContext,
  UserCardContext
} from './UserCardContext'
import { UserCardActions } from './UserCardActions'
import { UserCardSettings } from './UserCardSettings'
import { ICardResponse } from '@wallet/shared'
import { Form } from '@/ui/forms/Form'
import { cardService, changePinSchema } from '@/lib/api/card'
import { Button } from '@/ui/Button'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { useRouter } from 'next/router'
import crypto from 'crypto'
import { Input } from '@/ui/forms/Input'
import { useToast } from '@/lib/hooks/useToast'

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
  nameOnCard: ICardResponse['nameOnCard']
  isBlocked: boolean
}

// Even if the UserCard lives inside the context we explicitly pass the card
// details as a prop, since we have to use this component in dialogs as well.
export const UserCardFront = ({
  nameOnCard,
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
          <span className="uppercase text-sm">{nameOnCard}</span>
        </div>
      </div>
      {isBlocked ? (
        <div className="absolute inset-0 z-10 bg-[url('/frozen.webp')] bg-cover bg-center opacity-50" />
      ) : null}
    </UserCardContainer>
  )
}

const UserCardBack = () => {
  const cardData = {
    Pan: 'fwefwfw',
    ExpiryDate: 'ferfrefe',
    Cvc2: '333'
  } // useCardContext()

  if (!cardData) {
    return null
  }

  return (
    <UserCardContainer>
      <div className="flex flex-col h-full">
        <div className="bg-[#005D5F] -mx-5 mt-1 h-12" />
        <div className="mt-auto space-y-6">
          <div>
            <p className="leading-3 text-xs font-medium">Card Number</p>
            <div className="flex items-center gap-x-3">
              <p className="font-mono">{cardData.Pan}</p>
              <CopyButton
                aria-label="copy card number"
                className="h-4 w-4 p-0"
                copyType="card"
                value={cardData.Pan}
              />
            </div>
          </div>
          <div className="flex gap-x-6">
            <div>
              <p className="leading-3 text-xs font-medium">Expiry</p>
              <p className="font-mono">{`${cardData.ExpiryDate.substring(0, 2)}/${cardData.ExpiryDate.substring(2, 4)}`}</p>
            </div>
            <div>
              <p className="leading-3 text-xs font-medium">CVV</p>
              <p className="font-mono">{cardData.Cvc2}</p>
            </div>
            <CopyButton
              aria-label="copy cvv"
              className="mt-2.5 -ml-3 h-4 w-4 p-0"
              copyType="card"
              value={cardData.Cvc2}
            />
          </div>
        </div>
      </div>
    </UserCardContainer>
  )
}

interface UserCardProps {
  card: ICardResponse
}

export const UserCard = ({ card }: UserCardProps) => {
  const [showDetails, setShowDetails] = useState(false)
  const [cardData, setCardData] = useState<ICardData | null>(null)

  if (card.status === 'SoftDelete') {
    return <>Your card has been terminated.</>
  }

  const isBlocked = isLockedCard(card)

  return (
    <UserCardContext.Provider
      value={{ card, showDetails, setShowDetails, cardData, setCardData }}
    >
      <KeysProvider>
        {card.isPinSet ? (
          <div className="grid grid-cols-1 lg:grid-cols-[20rem_1fr] max-w-3xl gap-x-24">
            <div className="space-y-6 max-w-80 mx-auto">
              {isBlocked ? (
                <UserCardFront
                  nameOnCard={`${card.nameOnCard} ${card.walletAddress}`}
                  isBlocked={isBlocked}
                />
              ) : null}
              {!isBlocked && showDetails ? <UserCardBack /> : null}
              {!isBlocked && !showDetails ? (
                <UserCardFront
                  nameOnCard={`${card.nameOnCard} ${card.walletAddress ? card.walletAddress.replace('https://', '$') : ''}`}
                  isBlocked={isBlocked}
                />
              ) : null}
              <UserCardActions />
            </div>
            <UserCardSettings />
          </div>
        ) : (
          <SetPinForm />
        )}
      </KeysProvider>
    </UserCardContext.Provider>
  )
}

const SetPinForm = () => {
  const router = useRouter()
  const { card } = useCardContext()
  const { toast } = useToast()
  const form = useZodForm({
    schema: changePinSchema
  })

  return (
    <Form
      form={form}
      className="max-w-lg mx-auto"
      onSubmit={async (data) => {
        const response = await cardService.getChangePinToken(card.id)

        if (!response.success) {
          toast({
            description:
              'Could not get details for change PIN. Please try again.',
            variant: 'error'
          })
          console.error(response.message)
          return
        }

        if (!response.result) {
          toast({
            description:
              'Could not get details for change PIN. Please try again.',
            variant: 'error'
          })
          console.error(response.message)
          return
        }

        const token = response.result

        const { publicKey } = parseJwt(token) as {
          publicKey: string
        }

        const pemPublicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`

        const buf = Buffer.from(data.pin, 'utf8')
        const cypher = crypto
          .publicEncrypt(
            {
              key: pemPublicKey,
              padding: crypto.constants.RSA_PKCS1_PADDING
            },
            buf
          )
          .toString('base64')

        const res = await cardService.changePin(card.id, {
          token,
          cypher
        })

        if (!res.success) {
          toast({
            description: 'Could not change PIN for card. Please try again.',
            variant: 'error'
          })
          console.error(response.message)
          return
        }

        toast({
          description: 'Card PIN was successfully set.',
          variant: 'success'
        })
        router.replace(router.asPath)
      }}
    >
      <p className="text-2xl">Set PIN</p>
      <Input
        type="password"
        inputMode="numeric"
        label="PIN"
        required
        maxLength={4}
        placeholder="Enter PIN"
        error={form.formState?.errors?.pin?.message}
        {...form.register('pin')}
      />
      <Input
        type="password"
        inputMode="numeric"
        label="Confirm PIN"
        required
        maxLength={4}
        placeholder="Repeat PIN"
        error={form.formState?.errors?.confirmPin?.message}
        {...form.register('confirmPin')}
      />
      <Button
        aria-label="set pin"
        type="submit"
        loading={form.formState.isSubmitting}
      >
        Confirm PIN change
      </Button>
    </Form>
  )
}
