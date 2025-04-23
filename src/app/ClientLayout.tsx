"use client"

import type React from "react"

import { useEffect } from "react"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Kiểm tra chế độ tối khi component mount
  useEffect(() => {
    const isDarkMode = localStorage.getItem("darkMode") === "true"
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  return <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">{children}</body>
}
