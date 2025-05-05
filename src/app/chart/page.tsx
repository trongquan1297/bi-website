"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { LineChart, BarChart, PieChart, Plus, Download, RefreshCw, Search, Trash2, Edit } from "lucide-react"
import { ChartBuilderModal } from "@/components/chart-builder"
import { ConfirmDeleteChartModal } from "@/components/chart/confirm-delete-chart-modal"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar, Pie } from "react-chartjs-2"

const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL

// Register required Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

interface Chart {
  id: number
  name: string
  dataset_id: number
  label_field: string
  value_field: string
  chart_type: string
  filters: Record<string, string>
  layout: {
    title: {
      text: string
    }
  }
  created_at: string
  updated_at: string
  owner?: string
}

export default function ChartPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [username, setUsername] = useState<string>("Người dùng")
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [charts, setCharts] = useState<Chart[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchAttempted, setFetchAttempted] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [chartToEdit, setChartToEdit] = useState<number | null>(null)
  const [chartToDelete, setChartToDelete] = useState<Chart | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editChartId, setEditChartId] = useState<number | null>(null)

  // Fetch charts from API
  const fetchCharts = useCallback(async () => {
    if (isRefreshing) return // Prevent multiple API calls

    setIsLoading(true)
    setIsRefreshing(true)
    setError(null)
    setFetchAttempted(true)

    try {

      const response = await fetch(`${API_BASE_URL}/api/charts/get`, {
        method: "GET",
        credentials: "include", // Include cookies for authentication
        // Add timeout to avoid waiting too long
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.charts) {
        setCharts(data.charts)
      } else {
        setCharts([])
      }
    } catch (error) {
      console.error("Error fetching charts:", error)
      if (error instanceof DOMException && error.name === "AbortError") {
        setError("Request timed out. Please check your network connection and try again.")
      } else {
        setError("Could not fetch charts. Please try again later.")
      }
      // Set charts to empty array to avoid displaying old data
      setCharts([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [isRefreshing])

  // Delete chart
  const handleDeleteChart = async () => {
    if (!chartToDelete) return

    setIsDeleting(true)

    try {

      const response = await fetch(`${API_BASE_URL}/api/charts/${chartToDelete.id}`, {
        method: "DELETE",
        credentials: "include", // Include cookies for authentication
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Could not delete chart")
      }

      // Delete successful, update list
      setCharts(charts.filter((chart) => chart.id !== chartToDelete.id))
      setIsDeleteModalOpen(false)
      setChartToDelete(null)
    } catch (error) {
      console.error("Error deleting chart:", error)
      setError(error instanceof Error ? error.message : "An error occurred while deleting the chart")
    } finally {
      setIsDeleting(false)
    }
  }

  // Open delete confirmation modal
  const handleOpenDeleteModal = (chart: Chart) => {
    setChartToDelete(chart)
    setIsDeleteModalOpen(true)
  }

  // Open edit modal
  const handleOpenEditModal = (chartId: number) => {
    setChartToEdit(chartId)
    setIsEditModalOpen(true)
  }

  const handleEditChart = (chartId: number) => {
    setEditChartId(chartId)
    setIsAddModalOpen(true)
  }

  // Get user info and charts when component mounts
  useEffect(() => {
    // Check authentication when component mounts
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    // Get user info from token
    try {
      const token = localStorage.getItem("auth-token")
      if (token) {
        // Decode token to get user info
        const base64Url = token.split(".")[1]
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const payload = JSON.parse(window.atob(base64))

        // Get username from payload
        setUsername(payload.sub || payload.username || "Người dùng")

        // Get avatar URL from payload if available
        if (payload.avatar_url) {
          setAvatarUrl(payload.avatar_url)
        }
      }
    } catch (error) {
      console.error("Error decoding token:", error)
    }

    // Only call fetchCharts once when component mounts
    if (!fetchAttempted) {
      fetchCharts()
    }
  }, [router, isAuthenticated, fetchCharts, fetchAttempted])

  // Refresh data
  const handleRefresh = () => {
    if (isRefreshing) return // Prevent multiple API calls
    setIsRefreshing(true)
    fetchCharts()
  }

  // Open add chart modal
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true)
  }

  // Filter charts by search term and chart type
  const filteredCharts = charts.filter((chart) => {
    const matchesSearch = chart.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = activeTab === "all" || chart.chart_type === activeTab
    return matchesSearch && matchesType
  })

  // Render chart based on type
  const renderChart = (chart: Chart) => {
    // Create sample data for chart
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    const values = Array.from({ length: 6 }, () => Math.floor(Math.random() * 100))

    const chartData = {
      labels,
      datasets: [
        {
          label: `${chart.value_field} by ${chart.label_field}`,
          data: values,
          backgroundColor: [
            "rgba(255, 99, 132, 0.5)",
            "rgba(54, 162, 235, 0.5)",
            "rgba(255, 206, 86, 0.5)",
            "rgba(75, 192, 192, 0.5)",
            "rgba(153, 102, 255, 0.5)",
            "rgba(255, 159, 64, 0.5)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
        },
        title: {
          display: true,
          text: chart.name,
        },
      },
    }

    switch (chart.chart_type) {
      case "line":
        return <Line data={chartData} options={options} />
      case "bar":
        return <Bar data={chartData} options={options} />
      case "pie":
        return <Pie data={chartData} options={options} />
      default:
        return <Line data={chartData} options={options} />
    }
  }

  // Show loading state
  if (isLoading && !isRefreshing && !fetchAttempted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-violet-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppSidebar />

      <div className="transition-all duration-300 md:pl-16">
        <AppHeader username={username} avatarUrl={avatarUrl} />

        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-26">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <LineChart className="h-6 w-6 text-violet-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Biểu Đồ</h2>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Tìm kiếm biểu đồ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Đang làm mới..." : "Làm mới"}
              </button>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center justify-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo Biểu Đồ
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-md mb-6">
              <p>{error}</p>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="mt-2 text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50"
              >
                {isRefreshing ? "Đang thử lại..." : "Thử lại"}
              </button>
            </div>
          )}

          {/* Chart Type Tabs */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`py-4 px-6 inline-flex items-center text-sm font-medium border-b-2 ${
                    activeTab === "all"
                      ? "border-violet-500 text-violet-600 dark:text-violet-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <span className="mr-2">Tất cả</span>
                </button>
                <button
                  onClick={() => setActiveTab("line")}
                  className={`py-4 px-6 inline-flex items-center text-sm font-medium border-b-2 ${
                    activeTab === "line"
                      ? "border-violet-500 text-violet-600 dark:text-violet-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <LineChart className="h-4 w-4 mr-2" />
                  Line Charts
                </button>
                <button
                  onClick={() => setActiveTab("bar")}
                  className={`py-4 px-6 inline-flex items-center text-sm font-medium border-b-2 ${
                    activeTab === "bar"
                      ? "border-violet-500 text-violet-600 dark:text-violet-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <BarChart className="h-4 w-4 mr-2" />
                  Bar Charts
                </button>
                <button
                  onClick={() => setActiveTab("pie")}
                  className={`py-4 px-6 inline-flex items-center text-sm font-medium border-b-2 ${
                    activeTab === "pie"
                      ? "border-violet-500 text-violet-600 dark:text-violet-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  Pie Charts
                </button>
              </nav>
            </div>
          </div>

          {filteredCharts.length === 0 && !isLoading && !error ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
              <LineChart className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Không tìm thấy biểu đồ</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? "Không có biểu đồ nào phù hợp với từ khóa tìm kiếm." : "Chưa có biểu đồ nào được tạo."}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo biểu đồ mới
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
                        Tên biểu đồ
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
                        Loại biểu đồ
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Người tạo
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Cập nhật lần cuối
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Thao tác
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
                          <span
                            className="cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
                            onClick={() => handleEditChart(chart.id)}
                          >
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
                            <button
                              className="text-violet-600 hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300"
                              onClick={() => handleEditChart(chart.id)}
                              title="Edit chart"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </button>
                            <button
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Download chart"
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Download</span>
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(chart)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete chart"
                            >
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
                          <h3
                            className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-violet-600 dark:hover:text-violet-400"
                            onClick={() => handleEditChart(chart.id)}
                          >
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
                          <button
                            className="p-1.5 rounded-md text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20"
                            onClick={() => handleEditChart(chart.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20">
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(chart)}
                            className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          >
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

      {/* Create chart modal */}
      <ChartBuilderModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditChartId(null)
        }}
        onSuccess={fetchCharts}
        editChartId={editChartId}
      />

      {/* Edit chart modal */}
      <ChartBuilderModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setChartToEdit(null)
        }}
        onSuccess={fetchCharts}
        editChartId={chartToEdit}
      />

      {/* Delete confirmation modal */}
      <ConfirmDeleteChartModal
        isOpen={isDeleteModalOpen}
        chartId={chartToDelete?.id || null}
        chartName={chartToDelete?.name || ""}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setChartToDelete(null)
        }}
        onConfirm={handleDeleteChart}
      />
    </div>
  )
}
