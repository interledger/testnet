import { Logo } from '@/ui/Logo'

type HeaderLogoProps = {
  header: string
}

export const HeaderLogo = ({ header }: HeaderLogoProps) => {
  return (
    <>
      <h2 className="mb-10 text-xl text-brand-green-3 md:hidden">{header}</h2>
      <Logo className="h-28 w-28 flex-shrink-0" />
      <h1 className="hidden space-x-4 text-5xl font-semibold text-brand-green-3 md:mt-10 md:block">
        {header}
      </h1>
    </>
  )
}
