"use client"

import type React from "react"
import { useTheme } from "@/app/contexts/theme-context"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isDarkMode } = useTheme()

  // Không cần useEffect ở đây vì đã xử lý trong ThemeProvider
  // ClientLayout chỉ cần render children

  return <>{children}</>
}
