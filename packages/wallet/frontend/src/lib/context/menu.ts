import { createContext, useContext } from 'react'

type MenuContextProps = {
  sidebarIsOpen: boolean
  setSidebarIsOpen: (isUserFirstTime: boolean) => void
}

export const MenuContext = createContext<MenuContextProps | null>(null)

export const useMenuContext = () => {
  const menuContext = useContext(MenuContext)

  if (!menuContext) {
    throw new Error('"useMenuContext" is used outside the MenuContextProvider.')
  }

  return menuContext
}
