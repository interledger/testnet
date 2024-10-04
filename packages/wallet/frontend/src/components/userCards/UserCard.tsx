import { useMemo, useState, type ComponentProps } from 'react'
import { CopyButton } from '@/ui/CopyButton'
import { Chip, GateHubLogo, MasterCardLogo } from '../icons/UserCardIcons'
import { cn } from '@/utils/helpers'
import { useCardContext, UserCardContext } from './UserCardContext'
import { UserCardActions } from './UserCardActions'
import { UserCardSettings } from './UserCardSettings'
import type { ICardResponse } from '@wallet/shared'

export type UserCardContainerProps = ComponentProps<'div'>

const UserCardContainer = ({
  children,
  className,
  ...props
}: UserCardContainerProps) => {
  return (
    <div
      className={cn(
        'relative text-purple-dark font-sans w-80 h-52 rounded-xl bg-white shadow-[rgba(0,0,0,0.16)_0px_10px_36px_0px,rgba(0,0,0,0.06)_0px_0px_0px_1px] py-4 px-5 overflow-hidden',
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
          <GateHubLogo className="opacity-50" />
          <span className="font-sans opacity-50">debit</span>
        </div>
        <div className="ml-4 mt-5">
          <Chip />
        </div>
        <div className="flex mt-auto justify-between items-center">
          <span className="uppercase opacity-50">{nameOnCard}</span>
          <MasterCardLogo />
        </div>
      </div>
      {isBlocked ? (
        <div className="absolute inset-0 z-10 bg-[url('/frozen.webp')] bg-cover bg-center opacity-50" />
      ) : null}
    </UserCardContainer>
  )
}

const UserCardBack = () => {
  const { card } = useCardContext()

  return (
    <UserCardContainer>
      <div className="flex flex-col h-full">
        <div className="bg-purple-dark -mx-5 mt-1 h-12" />
        <div className="mt-auto space-y-6">
          <div>
            <p className="leading-3 text-xs font-medium opacity-50">
              Card Number
            </p>
            <div className="flex items-center gap-x-3">
              <p className="font-mono">{card.number}</p>
              <CopyButton
                aria-label="copy card number"
                className="h-4 w-4 p-0 opacity-50"
                copyType="card"
                value={card.number}
              />
            </div>
          </div>
          <div className="flex gap-x-6">
            <div>
              <p className="leading-3 text-xs font-medium opacity-50">Expiry</p>
              <p className="font-mono">{card.expiry}</p>
            </div>
            <div>
              <p className="leading-3 text-xs font-medium opacity-50">CVV</p>
              <p className="font-mono">{card.cvv}</p>
            </div>
            <CopyButton
              aria-label="copy cvv"
              className="mt-2.5 -ml-3 h-4 w-4 p-0 opacity-50"
              copyType="card"
              value={card.cvv.toString()}
            />
            <MasterCardLogo className="ml-auto" />
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

  // Q: When the user freezes the card is it going to have the status `Blocked`
  // or `TemporaryBlocked`
  //
  // Q; When the user receives the card, what status will it have?
  const isBlocked = useMemo(() => card.status === 'Blocked', [card])

  return (
    <UserCardContext.Provider value={{ card, showDetails, setShowDetails }}>
      <div className="grid grid-cols-1 md:grid-cols-[20rem_1fr] max-w-3xl gap-x-24">
        <div className="space-y-6 max-w-80 mx-auto">
          {isBlocked ? (
            <UserCardFront nameOnCard={card.nameOnCard} isBlocked={isBlocked} />
          ) : null}
          {!isBlocked && showDetails ? <UserCardBack /> : null}
          {!isBlocked && !showDetails ? (
            <UserCardFront nameOnCard={card.nameOnCard} isBlocked={isBlocked} />
          ) : null}
          <UserCardActions />
        </div>
        <UserCardSettings />
      </div>
    </UserCardContext.Provider>
  )
}
