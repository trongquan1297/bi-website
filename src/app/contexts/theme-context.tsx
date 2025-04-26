"use client"

import { createContext, useContext, useState, useEffect } from "react"

interface ThemeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const storedTheme = localStorage.getItem("darkMode") === "true"
    setIsDarkMode(storedTheme)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const body = document.body
  
    if (isDarkMode) {
      root.classList.add("dark")
      body.classList.remove("bg-gray-50", "text-gray-900")
      body.classList.add("bg-gray-900", "text-gray-100")
    } else {
      root.classList.remove("dark")
      body.classList.remove("bg-gray-900", "text-gray-100")
      body.classList.add("bg-gray-50", "text-gray-900")
    }
  }, [isDarkMode])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem("darkMode", newDarkMode.toString())
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
