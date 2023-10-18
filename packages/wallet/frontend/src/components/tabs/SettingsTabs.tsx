import { Tabs } from './Tabs'

const tabs = [
  {
    name: 'Account',
    href: '/settings'
  },
  {
    name: 'Developer Keys',
    href: '/settings/developer-keys'
  }
]

export const SettingsTabs = () => {
  return <Tabs tabs={tabs} />
}
