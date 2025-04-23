"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { LineChart, BarChart, PieChart, Plus, Download, RefreshCw, Search, Trash2, Edit } from "lucide-react"
import { AddChartModal } from "@/components/chart/add-chart-modal"
import { ConfirmDeleteChartModal } from "@/components/chart/confirm-delete-chart-modal"
import { getAuthHeader } from "@/lib/auth"
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

// Đăng ký các components cần thiết cho Chart.js
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

  // State cho modal thêm chart
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Thêm state cho modal xác nhận xóa chart
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [chartToDelete, setChartToDelete] = useState<Chart | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Hàm lấy dữ liệu charts từ API
  const fetchCharts = useCallback(async () => {
    if (isRefreshing) return // Ngăn chặn nhiều lần gọi API cùng lúc

    setIsLoading(true)
    setIsRefreshing(true)
    setError(null)
    setFetchAttempted(true)

    try {
      // Lấy auth header từ client
      const authHeader = getAuthHeader()

      // Sử dụng API route proxy để tránh lỗi CORS
      const response = await fetch("/api/charts", {
        headers: {
          Authorization: authHeader,
        },
        // Thêm timeout để tránh chờ quá lâu
        signal: AbortSignal.timeout(10000), // 10 giây timeout
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
      if (error instanceof DOMException && error.name === "AbortError") {
        setError("Yêu cầu bị hủy do quá thời gian. Vui lòng kiểm tra kết nối mạng và thử lại.")
      } else {
        setError("Không thể lấy dữ liệu charts. Vui lòng thử lại sau.")
      }
      // Đặt charts thành mảng rỗng để tránh hiển thị dữ liệu cũ
      setCharts([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [isRefreshing])

  // Thêm hàm xóa chart
  const handleDeleteChart = async () => {
    if (!chartToDelete) return

    setIsDeleting(true)

    try {
      const authHeader = getAuthHeader()

      const response = await fetch(`/api/charts/${chartToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
        },
        signal: AbortSignal.timeout(10000), // 10 giây timeout
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Không thể xóa biểu đồ")
      }

      // Xóa thành công, cập nhật danh sách
      setCharts(charts.filter((chart) => chart.id !== chartToDelete.id))
      setIsDeleteModalOpen(false)
      setChartToDelete(null)
    } catch (error) {
      console.error("Error deleting chart:", error)
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa biểu đồ")
    } finally {
      setIsDeleting(false)
    }
  }

  // Thêm hàm mở modal xác nhận xóa
  const handleOpenDeleteModal = (chart: Chart) => {
    setChartToDelete(chart)
    setIsDeleteModalOpen(true)
  }

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

    // Chỉ gọi fetchCharts một lần khi component mount
    if (!fetchAttempted) {
      fetchCharts()
    }
  }, [router, isAuthenticated, fetchCharts, fetchAttempted])

  // Hàm làm mới dữ liệu
  const handleRefresh = () => {
    if (isRefreshing) return // Ngăn chặn nhiều lần gọi API cùng lúc
    setIsRefreshing(true)
    fetchCharts()
  }

  // Hàm mở modal thêm chart
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true)
  }

  // Lọc charts theo từ khóa tìm kiếm và loại chart
  const filteredCharts = charts.filter((chart) => {
    const matchesSearch = chart.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = activeTab === "all" || chart.chart_type === activeTab
    return matchesSearch && matchesType
  })

  // Render chart dựa vào loại
  const renderChart = (chart: Chart) => {
    // Tạo dữ liệu mẫu cho chart
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

  // Hiển thị trạng thái loading
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

      <div className="transition-all duration-300 md:pl-64">
        <AppHeader username={username} avatarUrl={avatarUrl} />

        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCharts.map((chart) => (
                <div key={chart.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">{chart.name}</h3>
                    <div className="flex space-x-2">
                      <button className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(chart)}
                        className="p-1 rounded-md text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 h-64">{renderChart(chart)}</div>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>Dataset ID: {chart.dataset_id}</span>
                      <span>Loại: {chart.chart_type}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Label: {chart.label_field}</span>
                      <span>Value: {chart.value_field}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal tạo biểu đồ */}
      <AddChartModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchCharts} />

      {/* Modal xác nhận xóa */}
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
