import { Link } from '@/ui/Link'
import { cx } from 'class-variance-authority'
import { useRouter } from 'next/router'

type Tab = {
  name: string
  href: string
}

type TabsProps = {
  tabs: Tab[]
}

export const Tabs = ({ tabs }: TabsProps) => {
  const router = useRouter()

  return (
    <div className="flex w-full flex-col space-y-5 md:max-w-lg">
      <div className="my-5 flex justify-between space-x-10 p-1">
        {
        tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={cx(
              'group relative px-10 py-2.5 text-center text-lg font-medium leading-5',
              router.asPath === tab.href
                ? 'text-green'
                : 'text-green-3 hover:text-green'
            )}
          >
            <>
              {tab.name}
              <div
                className={cx(
                  'absolute inset-x-0 bottom-0 h-1 rounded-full',
                  router.asPath === tab.href
                    ? 'bg-green'
                    : 'bg-gradient-primary group-hover:bg-gradient-to-r group-hover:from-green group-hover:to-green'
                )}
              />
            </>
          </Link>
        ))}
      </div>
    </div>
  )
}
