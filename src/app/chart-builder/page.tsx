"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { ChartBuilderModal } from "@/components/chart-builder"
import { LineChart, Plus, Download, RefreshCw, Search, Trash2, Edit } from "lucide-react"
import { getAuthHeader } from "@/lib/auth"

interface Chart {
  id: number
  name: string
  dataset_id: number
  chart_type: string
  created_at: string
  updated_at: string
  owner?: string
}

export default function ChartBuilderPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [username, setUsername] = useState<string>("Người dùng")
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [charts, setCharts] = useState<Chart[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isChartBuilderOpen, setIsChartBuilderOpen] = useState(false)

  // Lấy thông tin người dùng và charts khi component mount
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

    fetchCharts()
  }, [router, isAuthenticated])

  // Hàm lấy dữ liệu charts từ API
  const fetchCharts = async () => {
    setIsLoading(true)
    setIsRefreshing(true)
    setError(null)

    try {
      // Lấy auth header từ client
      const authHeader = getAuthHeader()

      // Sử dụng API route proxy để tránh lỗi CORS
      const response = await fetch("/api/charts", {
        headers: {
          Authorization: authHeader,
        },
      })

      if (!response.ok) {
        throw new Error(`Lỗi khi lấy dữ liệu: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.charts) {
        setCharts(data.charts)
      } else {
        setCharts([])
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu charts:", error)
      setError("Không thể lấy dữ liệu charts. Vui lòng thử lại sau.")
      // Đặt charts thành mảng rỗng để tránh hiển thị dữ liệu cũ
      setCharts([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Lọc charts theo từ khóa tìm kiếm
  const filteredCharts = charts.filter((chart) => chart.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Hiển thị trạng thái loading
  if (isLoading && !isRefreshing) {
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
              <LineChart className="h-6 w-6 text-violet-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Chart Builder</h2>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search charts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <button
                onClick={fetchCharts}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
              <button
                onClick={() => setIsChartBuilderOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Chart
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-md mb-6">
              <p>{error}</p>
              <button
                onClick={fetchCharts}
                disabled={isRefreshing}
                className="mt-2 text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50"
              >
                {isRefreshing ? "Trying again..." : "Try again"}
              </button>
            </div>
          )}

          {filteredCharts.length === 0 && !isLoading ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
              <LineChart className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No charts found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? "No charts match your search criteria." : "You haven't created any charts yet."}
              </p>
              <button
                onClick={() => setIsChartBuilderOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first chart
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              {/* Desktop view - table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Dataset ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Chart Type
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Owner
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Last Updated
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredCharts.map((chart) => (
                      <tr key={chart.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {chart.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <span className="cursor-pointer hover:text-violet-600 dark:hover:text-violet-400">
                            {chart.name || "Untitled Chart"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {chart.dataset_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {chart.chart_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {chart.owner || "You"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {new Date(chart.updated_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button className="text-violet-600 hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </button>
                            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </button>
                            <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile view - cards */}
              <div className="md:hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredCharts.map((chart) => (
                    <div key={chart.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-violet-600 dark:hover:text-violet-400">
                            {chart.name || "Untitled Chart"}
                          </h3>
                          <div className="flex items-center mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 mr-2">
                              {chart.chart_type}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Dataset ID: {chart.dataset_id}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">ID: {chart.id}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <div>Owner: {chart.owner || "You"}</div>
                          <div>Updated: {new Date(chart.updated_at).toLocaleString()}</div>
                        </div>
                        <div className="flex space-x-3">
                          <button className="p-1.5 rounded-md text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20">
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Chart Builder Modal */}
      <ChartBuilderModal
        isOpen={isChartBuilderOpen}
        onClose={() => setIsChartBuilderOpen(false)}
        onSuccess={fetchCharts}
      />
    </div>
  )
}
