import { KYCFormContextProvider } from './context'
import { TabsNavigation, Tabs } from './Tabs'

export const KYC = () => {
  return (
    <KYCFormContextProvider>
      <Tabs />
      <TabsNavigation />
    </KYCFormContextProvider>
  )
}
