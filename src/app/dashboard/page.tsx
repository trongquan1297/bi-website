"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { BarChart, PieChart, LineChart, Plus, RefreshCw } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [username, setUsername] = useState<string>("Người dùng")
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

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
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <BarChart className="h-6 w-6 text-violet-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                New Dashboard
              </button>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Metric Card 1 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Users</h3>
                <span className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                  <User className="h-5 w-5" />
                </span>
              </div>
              <div className="flex items-baseline">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">2,543</p>
                <p className="ml-2 text-sm text-green-600 dark:text-green-400">+12.5%</p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Compared to last month</p>
            </div>

            {/* Metric Card 2 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Revenue</h3>
                <span className="p-2 bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300 rounded-full">
                  <DollarSign className="h-5 w-5" />
                </span>
              </div>
              <div className="flex items-baseline">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">$42,580</p>
                <p className="ml-2 text-sm text-green-600 dark:text-green-400">+8.2%</p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Compared to last month</p>
            </div>

            {/* Metric Card 3 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Active Projects</h3>
                <span className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300 rounded-full">
                  <Briefcase className="h-5 w-5" />
                </span>
              </div>
              <div className="flex items-baseline">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">78</p>
                <p className="ml-2 text-sm text-red-600 dark:text-red-400">-2.5%</p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Compared to last month</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Revenue Overview</h3>
                <div className="flex space-x-2">
                  <button className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                    <LineChart className="h-5 w-5" />
                  </button>
                  <button className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                    <BarChart className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                <p className="text-gray-500 dark:text-gray-400">Chart Placeholder</p>
              </div>
            </div>

            {/* Chart 2 */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">User Demographics</h3>
                <div className="flex space-x-2">
                  <button className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                    <PieChart className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                <p className="text-gray-500 dark:text-gray-400">Chart Placeholder</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Thêm các biểu tượng thiếu
function User(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function DollarSign(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function Briefcase(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}
