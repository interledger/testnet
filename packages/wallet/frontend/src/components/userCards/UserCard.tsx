import { CopyButton } from '@/ui/CopyButton'
import { NormalCard } from '../icons/NormalCard'
import { DetailsCard } from '../icons/DetailsCard'
import Image from 'next/image'
import { CardTypes } from '@/pages/card'

type UserCardProps = {
  type: CardTypes
}
// ToDO - check adding cards as css, not as svg or overlay webp
export const UserCard = ({ type }: UserCardProps) => {
  return (
    <div className="w-full h-52 items-center flex">
      {type === 'normal' ? (
        <>
          <NormalCard className="absolute" />
          <span className="text-white uppercase relative top-[73px] left-6">
            Timi Swift
          </span>
        </>
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
