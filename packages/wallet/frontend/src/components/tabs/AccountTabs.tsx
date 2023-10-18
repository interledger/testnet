import { Tabs } from './Tabs'

type AccountTabsProps = {
  accountId: string
}

export const AccountTabs = ({ accountId }: AccountTabsProps) => {
  const tabs = [
    {
      name: 'Account',
      href: `/account/${accountId}`
    },
    {
      name: 'Web Monetization',
      href: `/account/web-monetization?accountId=${accountId}`
    }
  ]

  return <Tabs tabs={tabs} />
}
