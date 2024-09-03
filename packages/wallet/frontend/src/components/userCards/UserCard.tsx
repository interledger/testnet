import { CopyButton } from '@/ui/CopyButton'
import { NormalCard } from '../icons/NormalCard'
import { DetailsCard } from '../icons/DetailsCard'
import Image from 'next/image'
import { CardTypes } from '@/lib/context/card'

type UserCardProps = {
  type: CardTypes
}

export const UserCard = ({ type }: UserCardProps) => {
  return (
    <div className="w-full h-52 items-center flex justify-center">
      {type === 'normal' ? (
        <>
          <NormalCard className="-z-10 absolute" />
          <span className="text-white uppercase relative top-[73px] -left-[91px]">
            Timi Swift
          </span>
        </>
      ) : type === 'details' ? (
        <>
          <DetailsCard className="-z-10 absolute" />
          <div className="text-white uppercase relative top-[22px] left-[16px]">
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
          <NormalCard className="-z-10 absolute" />
          <span className="text-white uppercase relative top-[73px] left-[24px] opacity-40">
            Timi Swift
          </span>
          <Image
            className="object-contain -ml-[95px] opacity-70"
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
