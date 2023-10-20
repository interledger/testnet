import { Tabs } from './Tabs'

type AccountTabsProps = {
  accountId: string
}

export const AccountTabs = ({ accountId }: AccountTabsProps) => {
  const tabs = [
    {
      name: 'Account',
      href: `/account/${accountId}?type=pp`
    },
    {
      name: 'Web Monetization',
      href: `/account/${accountId}?type=wm`
    }
  ]

  return <Tabs tabs={tabs} />
}
