import { Logo } from '@/ui/Logo'
import { cx } from 'class-variance-authority'

type HeaderLogoProps = {
  header: string
  type?: string
}

export const HeaderLogo = ({ header, type }: HeaderLogoProps) => {
  return (
    <div className="flex flex-col-reverse items-center md:flex-col">
      <Logo className={cx('h-28 w-28 flex-shrink-0')} />
      <h1
        className={cx(
          'mb-10 block space-x-4 text-xl md:mb-0 md:mt-10 md:text-5xl md:font-semibold',
          type === 'kyc' ? 'text-brand-green-3' : 'text-brand-turqoise'
        )}
      >
        {header}
      </h1>
    </div>
  )
}
