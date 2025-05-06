"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface ThemeContextType {
  isDarkMode: boolean
  toggleDarkMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Không khởi tạo giá trị ban đầu của isDarkMode ở đây
  const [isDarkMode, setIsDarkMode] = useState<boolean | undefined>(undefined)
  const [mounted, setMounted] = useState(false)

  // Chỉ chạy một lần khi component được mount
  useEffect(() => {
    // Đọc theme từ localStorage hoặc sử dụng prefers-color-scheme
    const storedTheme = localStorage.getItem("darkMode")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    // Nếu đã lưu trong localStorage, sử dụng giá trị đó
    // Nếu không, sử dụng prefers-color-scheme của hệ thống
    setIsDarkMode(storedTheme !== null ? storedTheme === "true" : prefersDark)

    setMounted(true)
  }, [])

  // Cập nhật DOM khi isDarkMode thay đổi
  useEffect(() => {
    if (!mounted || isDarkMode === undefined) return

    const root = document.documentElement

    if (isDarkMode) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }

    // Lưu theme vào localStorage
    localStorage.setItem("darkMode", isDarkMode.toString())
  }, [isDarkMode, mounted])

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev)
  }

  // Đảm bảo ThemeProvider chỉ render children khi đã xác định được trạng thái theme
  // hoặc cung cấp một giá trị mặc định cho chế độ sáng (false) khi isDarkMode còn undefined
  const contextValue = {
    isDarkMode: isDarkMode !== undefined ? isDarkMode : false,
    toggleDarkMode
  }

  return (
    <ThemeContext.Provider value={contextValue}>
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