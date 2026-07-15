import { createContext, useContext } from 'react'

export interface ThemeContextValue {
  isDark: boolean
  toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggle: () => undefined })

export const useTheme = () => useContext(ThemeContext)
