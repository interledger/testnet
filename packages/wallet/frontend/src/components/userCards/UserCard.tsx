import type { ComponentProps } from 'react'
import { CopyButton } from '@/ui/CopyButton'
import { Chip, GateHubLogo, MasterCardLogo } from '../icons/UserCardIcons'
import { cn } from '@/utils/helpers'

const CARD_TYPE = {
  normal: 'normal',
  details: 'details',
  frozen: 'frozen'
} as const

export type CardType = keyof typeof CARD_TYPE

interface UserCardProps {
  type: CardType
  name: string
}

export type UserCardContainerProps = ComponentProps<'div'>

const UserCardContainer = ({
  children,
  className,
  ...props
}: UserCardContainerProps) => {
  return (
    <div
      className={cn(
        'relative text-white font-sans w-80 h-52 rounded-xl bg-[#0A6CF1] py-4 px-5 overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface UserCardFrontProps {
  name: UserCardProps['name']
  isFrozen: boolean
}

const UserCardFront = ({ name, isFrozen }: UserCardFrontProps) => {
  return (
    <UserCardContainer>
      <div
        className={cn(
          'flex flex-col h-full',
          isFrozen ? 'select-none pointer-events-none blur' : ''
        )}
      >
        <div className="flex justify-between text-sm items-center">
          <GateHubLogo />
          <span className="font-sans">debit</span>
        </div>
        <div className="ml-4 mt-5">
          <Chip />
        </div>
        <div className="flex mt-auto justify-between items-center">
          <span className="uppercase">{name}</span>
          <MasterCardLogo />
        </div>
      </div>
      {isFrozen ? (
        <div className="absolute inset-0 z-10 bg-[url('/frozen.webp')] bg-cover bg-center opacity-50" />
      ) : null}
    </UserCardContainer>
  )
}

const UserCardBack = () => {
  return (
    <UserCardContainer>
      <div className="flex flex-col h-full">
        <div className="bg-[#0046A5] -mx-5 mt-1 h-12" />
        <div className="mt-auto space-y-6">
          <div>
            <p className="leading-3 text-xs font-medium opacity-50">
              Card Number
            </p>
            <div className="flex items-center gap-x-3">
              <p className="font-mono">4242 4242 4242 4242</p>
              <CopyButton
                aria-label="copy card number"
                className="h-4 w-4 p-0"
                copyType="card"
                value="4242 4242 4242 4242"
              />
            </div>
          </div>
          <div className="flex gap-x-6">
            <div>
              <p className="leading-3 text-xs font-medium opacity-50">Expiry</p>
              <p className="font-mono">01/27</p>
            </div>
            <div>
              <p className="leading-3 text-xs font-medium opacity-50">CVV</p>
              <div className="flex items-center gap-x-3">
                <p className="font-mono">123</p>
                <CopyButton
                  aria-label="copy cvv"
                  className="h-4 w-4 p-0"
                  copyType="card"
                  value="123"
                />
              </div>
            </div>
            <MasterCardLogo className="ml-auto" />
          </div>
        </div>
      </div>
    </UserCardContainer>
  )
}

export const UserCard = ({ type, name }: UserCardProps) => {
  return (
    <>
      {type === 'normal' || type === 'frozen' ? (
        <UserCardFront
          name={name}
          isFrozen={type === 'frozen' ? true : false}
        />
      ) : type === 'details' ? (
        <UserCardBack />
      ) : null}
    </>
  )
}
