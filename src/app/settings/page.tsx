"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { useTheme } from "@/app/contexts/theme-context"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"

export default function SettingsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [username, setUsername] = useState<string>("Người dùng")
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    // Kiểm tra xác thực khi component mount
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    // Lấy thông tin người dùng từ token
    try {
      const token = localStorage.getItem("auth-token")
      if (token) {
        // Giải mã token để lấy thông tin người dùng
        const base64Url = token.split(".")[1]
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const payload = JSON.parse(window.atob(base64))

        // Lấy username từ payload
        setUsername(payload.sub || payload.username || "Người dùng")

        // Lấy avatar URL từ payload nếu có
        if (payload.avatar_url) {
          setAvatarUrl(payload.avatar_url)
        }
      }
    } catch (error) {
      console.error("Lỗi khi giải mã token:", error)
    }

    setIsLoading(false)
  }, [router, isAuthenticated])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-violet-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppSidebar />

      <div className="transition-all duration-300 md:pl-64">
        <AppHeader username={username} avatarUrl={avatarUrl} />

        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Cài đặt tài khoản</h2>

            <div className="space-y-6">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">Chế độ tối</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Bật chế độ tối để giảm mỏi mắt khi sử dụng ứng dụng vào ban đêm.
                  </p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                    isDarkMode ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Notifications Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">Thông báo</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nhận thông báo về các cập nhật và tin nhắn mới.
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                    notifications ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Profile Information */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">Thông tin cá nhân</h3>

                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Họ tên
                    </label>
                    <input
                      type="text"
                      id="name"
                      defaultValue={username}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-violet-500 focus:outline-none focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      defaultValue="user@example.com"
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-violet-500 focus:outline-none focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
