"use client"

import { useState, useEffect } from "react"
import { Moon, Sun, User, Bell, Search } from "lucide-react"
import { usePathname } from "next/navigation"
import { useTheme } from "@/app/contexts/theme-context"

interface AppHeaderProps {
  username: string
  avatarUrl?: string
}

export function AppHeader({ username, avatarUrl }: AppHeaderProps) {
  const pathname = usePathname()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [pageTitle, setPageTitle] = useState("Dashboard")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Cập nhật tiêu đề trang dựa trên đường dẫn hiện tại
  useEffect(() => {
    if (pathname.includes("/dataset")) {
      setPageTitle("Dataset")
    } else if (pathname.includes("/chart")) {
      setPageTitle("Chart")
    } else if (pathname.includes("/dashboard")) {
      setPageTitle("Dashboard")
    } else if (pathname.includes("/chat")) {
      setPageTitle("Chat")
    } else if (pathname.includes("/settings")) {
      setPageTitle("Settings")
    } else if (pathname.includes("/home")) {
      setPageTitle("Home")
    }
  }, [pathname])

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{pageTitle}</h1>

        <div className="flex items-center space-x-3 sm:space-x-6">
          {/* Search - hidden on mobile */}
          <div className="hidden md:flex items-center relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="pl-9 pr-4 py-1.5 rounded-full text-sm border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 w-48 transition-all duration-300 focus:w-64"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* Notifications */}
          <button className="relative p-1.5 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{username}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Người dùng</div>
            </div>
            <div className="h-9 w-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
              {avatarUrl ? (
                <img
                  src={avatarUrl || "/placeholder.svg"}
                  alt={`${username}'s avatar`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // Fallback to default avatar if image fails to load
                    ;(e.target as HTMLImageElement).src = "/default-avatar.png"
                  }}
                />
              ) : (
                <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search - shown when menu is open */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full pl-9 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      )}
    </header>
  )
}
