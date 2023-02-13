import { Logo } from '@/ui/Logo'
import { cx } from 'class-variance-authority'

type HeaderLogoProps = {
  header: string
  type?: string
}

export const HeaderLogo = ({ header, type }: HeaderLogoProps) => {
  return (
    <>
      <h2
        className={cx(
          'mb-10 text-xl md:hidden',
          type === 'kyc' ? 'text-brand-green-3' : 'text-brand-turqoise'
        )}
      >
        {header}
      </h2>
      <Logo
        className={cx(
          'h-28 w-28 flex-shrink-0',
          type === 'kyc'
            ? 'absolute top-8 mr-[80%] h-10 w-10 md:relative md:top-0 md:clear-none md:mx-auto md:block md:h-28 md:w-28'
            : ''
        )}
      />
      <h1
        className={cx(
          'hidden space-x-4 text-5xl font-semibold md:mt-10 md:block',
          type === 'kyc' ? 'text-brand-green-3' : 'text-brand-turqoise'
        )}
      >
        {header}
      </h1>
    </>
  )
}
