import { createContext, useContext } from 'react'

type ThemeContextProps = {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

export const ThemeContext = createContext<ThemeContextProps | null>(null)

export const useThemeContext = () => {
  const themeContext = useContext(ThemeContext)

  if (!themeContext) {
    throw new Error(
      '"useThemeContext" is used outside the ThemeContextProvider.'
    )
  }

  return themeContext
}
