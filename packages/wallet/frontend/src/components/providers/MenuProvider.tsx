import { MenuContext } from '@/lib/context/menu'
import { ReactNode, useState } from 'react'

type MenuProviderProps = {
  children: ReactNode
}

export const MenuProvider = ({ children }: MenuProviderProps) => {
  const [sidebarIsOpen, setSidebarIsOpen] = useState(false)
  const [isCardsVisible, setIsCardsVisible] = useState(true)

  return (
    <MenuContext.Provider
      value={{
        sidebarIsOpen,
        setSidebarIsOpen,
        isCardsVisible,
        setIsCardsVisible
      }}
    >
      {children}
    </MenuContext.Provider>
  )
}
