import { Logo } from '@/ui/Logo'
import { cx } from 'class-variance-authority'

type HeaderLogoProps = {
  header: string
}

export const HeaderLogo = ({ header }: HeaderLogoProps) => {
  return (
    <div className="flex flex-col items-center md:flex-col">
      <Logo className={cx('h-36 w-60 flex-shrink-0')} />
      <h1 className="mb-5 block space-x-4 text-center text-xl md:mb-0 md:mt-5 md:text-3xl md:font-semibold">
        {header}
      </h1>
    </div>
  )
}
