import { CopyButton } from '@/ui/CopyButton'
import { NormalCard } from '../icons/NormalCard'
import { DetailsCard } from '../icons/DetailsCard'
import Image from 'next/image'
import { Chip, GateHubLogo, MasterCardLogo } from '../icons/UserCardIcons'
import type { ComponentProps } from 'react'

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

const UserCardContainer = ({ children, ...props }: UserCardContainerProps) => {
  return (
    <div
      className="relative flex text-white font-sans flex-col w-80 h-52 rounded-xl bg-[#0A6CF1] py-4 px-5"
      {...props}
    >
      {children}
    </div>
  )
}

interface UserCardFrontProps {
  name: UserCardProps['name']
}

const UserCardFront = ({ name }: UserCardFrontProps) => {
  return (
    <UserCardContainer>
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
    </UserCardContainer>
  )
}
// ToDO - check adding cards as css, not as svg or overlay webp
export const UserCard = ({ type }: UserCardProps) => {
export const UserCard = ({ type, name }: UserCardProps) => {
  return (
    <div className="w-full h-52 items-center flex">
      {type === 'normal' ? (
        <UserCardFront name={name} />
      ) : type === 'details' ? (
        <>
          <DetailsCard className="absolute" />
          <div className="text-white uppercase relative top-[22px] left-4">
            <span>1234 5678 9012 3456</span>
            <CopyButton
              aria-label="copy key id"
              className="h-5 w-5"
              copyType="card"
              value="1234 5678 9012 3456"
            />
          </div>
          <span className="text-white uppercase relative top-[77px] -left-[194px]">
            09/30
          </span>
          <span className="text-white uppercase relative top-[74px] -left-[174px]">
            999
            <CopyButton
              aria-label="copy key id"
              className="h-5 w-5"
              copyType="card"
              value="999"
            />
          </span>
        </>
      ) : (
        <>
          <NormalCard className="absolute" />
          <span className="text-white uppercase relative top-[73px] left-6 opacity-40 min-w-56">
            Timi Swift
          </span>
          <Image
            className="object-contain -ml-56 opacity-70"
            src="/frozen.webp"
            alt="Frozen"
            width={330}
            height={120}
          />
        </>
      )}
    </div>
  )
}
