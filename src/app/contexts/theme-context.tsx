"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type ThemeProviderProps = {
  children: ReactNode
}

type ThemeContextType = {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Khởi tạo trạng thái dark mode từ localStorage khi component mount
  useEffect(() => {
    const storedDarkMode = localStorage.getItem("darkMode") === "true"
    setIsDarkMode(storedDarkMode)

    // Áp dụng class dark vào document.documentElement
    if (storedDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    setIsInitialized(true)
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)

    // Lưu trạng thái vào localStorage
    localStorage.setItem("darkMode", String(newDarkMode))

    // Áp dụng class dark vào document.documentElement
    if (newDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  // Chỉ render children sau khi đã khởi tạo trạng thái dark mode
  if (!isInitialized) {
    return null
  }

  return <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
