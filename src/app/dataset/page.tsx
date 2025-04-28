"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Database, Plus, Download, RefreshCw, Search, ExternalLink, Trash2, Info } from "lucide-react"
import { AddDatasetModal } from "@/components/dataset/add-dataset-modal"
import { ConfirmDeleteModal } from "@/components/dataset/confirm-delete-modal"
import { getAuthHeader } from "@/lib/auth"

interface Dataset {
  id: number
  database: string
  table_name: string
}

export default function DatasetPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [username, setUsername] = useState<string>("Người dùng")
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchAttempted, setFetchAttempted] = useState(false)

  // State cho modal thêm dataset
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // State cho modal xác nhận xóa
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [datasetToDelete, setDatasetToDelete] = useState<Dataset | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Hàm lấy dữ liệu datasets từ API
  const fetchDatasets = useCallback(async () => {
    if (isRefreshing) return // Ngăn chặn nhiều lần gọi API cùng lúc

    setIsLoading(true)
    setIsRefreshing(true)
    setError(null)
    setFetchAttempted(true)

    try {
      // Lấy auth header từ client
      const authHeader = getAuthHeader()

      // Sử dụng API route proxy để tránh lỗi CORS
      const response = await fetch("/api/datasets", {
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

      if (data && data.datasets) {
        setDatasets(data.datasets)
      } else {
        setDatasets([])
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu datasets:", error)
      if (error instanceof DOMException && error.name === "AbortError") {
        setError("Yêu cầu bị hủy do quá thời gian. Vui lòng kiểm tra kết nối mạng và thử lại.")
      } else {
        setError("Không thể lấy dữ liệu datasets. Vui lòng thử lại sau.")
      }
      // Đặt datasets thành mảng rỗng để tránh hiển thị dữ liệu cũ
      setDatasets([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [isRefreshing])

  // Lấy thông tin người dùng và datasets khi component mount
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

    // Chỉ gọi fetchDatasets một lần khi component mount
    if (!fetchAttempted) {
      fetchDatasets()
    }
  }, [router, isAuthenticated, fetchDatasets, fetchAttempted])

  // Hàm làm mới dữ liệu
  const handleRefresh = () => {
    if (isRefreshing) return // Ngăn chặn nhiều lần gọi API cùng lúc
    setIsRefreshing(true)
    fetchDatasets()
  }

  // Hàm mở modal thêm dataset
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true)
  }

  // Hàm mở modal xác nhận xóa
  const handleOpenDeleteModal = (dataset: Dataset) => {
    setDatasetToDelete(dataset)
    setIsDeleteModalOpen(true)
  }

  // Hàm xóa dataset
  const handleDeleteDataset = async () => {
    if (!datasetToDelete) return

    setIsDeleting(true)

    try {
      const authHeader = getAuthHeader()

      const response = await fetch(`/api/datasets/${datasetToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
        },
        signal: AbortSignal.timeout(10000), // 10 giây timeout
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Không thể xóa dataset")
      }

      // Xóa thành công, cập nhật danh sách
      setDatasets(datasets.filter((dataset) => dataset.id !== datasetToDelete.id))
      setIsDeleteModalOpen(false)
      setDatasetToDelete(null)
    } catch (error) {
      console.error("Error deleting dataset:", error)
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi khi xóa dataset")
    } finally {
      setIsDeleting(false)
    }
  }

  // Lọc datasets theo từ khóa tìm kiếm
  const filteredDatasets = datasets.filter(
    (dataset) =>
      dataset.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dataset.database.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

      <div className="transition-all duration-300 md:pl-16">
        <AppHeader username={username} avatarUrl={avatarUrl} />

        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-26">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <Database className="h-6 w-6 text-violet-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Datasets</h2>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Tìm kiếm dataset..."
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
                Thêm Dataset
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

          {filteredDatasets.length === 0 && !isLoading && !error ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
              <Database className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Không tìm thấy dataset</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? "Không có dataset nào phù hợp với từ khóa tìm kiếm." : "Chưa có dataset nào được tạo."}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo dataset mới
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              {isRefreshing && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm">
                  <div className="flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    <span>Đang tải dữ liệu...</span>
                  </div>
                </div>
              )}

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
                        Database
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        Tên bảng
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
                    {filteredDatasets.map((dataset) => (
                      <tr key={dataset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {dataset.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {dataset.database}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {dataset.table_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button className="text-violet-600 hover:text-violet-900 dark:text-violet-400 dark:hover:text-violet-300">
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">Xem</span>
                            </button>
                            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Tải xuống</span>
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(dataset)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Xóa</span>
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
                  {filteredDatasets.map((dataset) => (
                    <div key={dataset.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">{dataset.table_name}</h3>
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {dataset.database}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">ID: {dataset.id}</span>
                      </div>
                      <div className="flex justify-end mt-3 space-x-3">
                        <button className="p-1.5 rounded-md text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20">
                          <Info className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20">
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(dataset)}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal thêm dataset */}
      <AddDatasetModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchDatasets} />

      {/* Modal xác nhận xóa */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        datasetId={datasetToDelete?.id || null}
        datasetName={datasetToDelete?.table_name || ""}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDatasetToDelete(null)
        }}
        onConfirm={handleDeleteDataset}
      />
    </div>
  )
}
