import { KYCFormContextProvider } from './context'
import { Tabs } from './Tabs'

export const KYC = () => {
  return (
    <KYCFormContextProvider>
      <Tabs />
      {/* ToDo - play buttons probably will be removed from code, and only submit buttons will stay  */}
      {/* <TabsNavigation /> */}
    </KYCFormContextProvider>
  )
}
